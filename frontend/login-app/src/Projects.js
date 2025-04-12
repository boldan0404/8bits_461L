import React, { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { Add } from '@mui/icons-material';


const API_BASE_URL = "http://127.0.0.1:5000";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for Create Project dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [availableHwsets, setAvailableHwsets] = useState([]);
    const [selectedHwsetIds, setSelectedHwsetIds] = useState([]);

    // Fetch projects from your Flask backend on mount
    useEffect(() => {
        async function fetchProjects() {
            try {
                const response = await fetch(`${API_BASE_URL}/projects`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch projects');
                }

                const data = await response.json();
                const username = localStorage.getItem('username');

                const transformedProjects = data.map((project, index) => {
                    const hardwareSets = (project.hwsets || []).map(hw => ({
                        hwset_id: hw.hwset_id,
                        name: hw.name,
                        available: hw.available ?? 0,
                        capacity: hw.capacity ?? 0,
                    }));

                    return {
                        id: project._id || index,
                        name: project.name,
                        description: project.description || "",
                        hardwareSets: hardwareSets,
                        authorizedUsers: project.authorized_users || [],
                        joined: (project.authorized_users || []).includes(username),
                    };
                });

                setProjects(transformedProjects);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
    }, []);


    useEffect(() => {
        async function fetchHwsets() {
            const response = await fetch(`${API_BASE_URL}/projects/hwsets`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            setAvailableHwsets(data);
        }
        if (createDialogOpen) fetchHwsets();
    }, [createDialogOpen]);

    const handleToggleHwset = (id) => {
        const stringId = id.toString(); // ensure consistency
        setSelectedHwsetIds(prev =>
            prev.includes(stringId)
                ? prev.filter(hid => hid !== stringId)
                : [...prev, stringId]
        );
    };

    const handleToggleJoin = (projectId) => {
        setProjects(prevProjects =>
            prevProjects.map(proj =>
                proj.id === projectId ? { ...proj, joined: !proj.joined } : proj
            )
        );
    };

    // This updates the hardwareSets array in local state after check-in/check-out
    const handleHardwareUpdate = (projectId, hardwareSetIndex, qty, type) => {
        setProjects(prevProjects =>
            prevProjects.map(project => {
                if (project.id !== projectId) return project;

                const updatedHardwareSets = project.hardwareSets.map((setString, index) => {
                    if (index !== hardwareSetIndex) return setString;

                    const label = setString.name || `HWSet ${index + 1}`;
                    let current = setString.available ?? 0;
                    let total = setString.capacity ?? 0;

                    if (type === 'checkin') {
                        current = Math.min(total, current + qty);
                    } else if (type === 'checkout') {
                        current = Math.max(0, current - qty);
                    }

                    return {
                        ...setString,
                        available: current,
                        name: label,
                        capacity: total
                    };
                });


                return { ...project, hardwareSets: updatedHardwareSets };
            })
        );
    };

    // --------------- Create Project Dialog Handlers ---------------
    const openCreateDialog = () => {
        setCreateDialogOpen(true);
    };

    const closeCreateDialog = () => {
        setProjectName("");
        setCreateDialogOpen(false);
    };

    const handleCreateProject = async () => {
        try {
            const hardware_sets = selectedHwsetIds;

            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    name: projectName,
                    description: projectDescription,
                    hardware_sets: hardware_sets
                })
            });

            if (!response.ok) {
                const errMsg = await response.json();
                throw new Error(errMsg.error || 'Error creating project');
            }

            // ✅ Only one refresh, not duplicated
            const newResponse = await fetch(`${API_BASE_URL}/projects`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const newData = await newResponse.json();
            const username = localStorage.getItem('username');

            const transformedProjects = newData.map((project, index) => {
                let hardwareSets = [];

                // ✅ Safely check for both keys
                if (project.hwsets) {
                    hardwareSets = project.hwsets.map(hw => {
                        const label = hw.name || hw.hwset_id;
                        const available = hw.available ?? 0;
                        const capacity = hw.capacity ?? 0;
                        return `${label}: ${available}/${capacity}`;
                    });
                } else if (project.hardware_sets) {
                    hardwareSets = Object.entries(project.hardware_sets).map(([setName, setData]) => {
                        const { available, capacity } = setData;
                        return `${setName}: ${available}/${capacity}`;
                    });
                }

                return {
                    id: project._id?.$oid || index,
                    name: project.name,
                    hardwareSets,
                    authorizedUsers: project.authorized_users || [],
                    joined: (project.authorized_users || []).includes(username),
                };
            });

            setProjects(transformedProjects);

            // ✅ Clear state and close dialog
            setCreateDialogOpen(false);
            setProjectName("");
            setProjectDescription("");
            setSelectedHwsetIds([]);

        } catch (error) {
            console.error("Failed to create project:", error);
            alert(error.message);
        }
    };


    // --------------- Log Out Handler ---------------
    const handleLogout = () => {
        // Remove token and username from local storage
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        // Redirect to homepage
        window.location.href = '/';
    };

    if (loading) {
        return <div>Loading projects...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }


    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            <Typography variant="h4" style={{ marginBottom: '16px' }}>
                Projects
            </Typography>
            {projects.map((proj) => (
                <ProjectCard
                    key={proj.id}
                    project={proj}
                    onToggleJoin={handleToggleJoin}
                    onCheckIn={(projectId, hardwareSetIndex, qty) =>
                        handleHardwareUpdate(projectId, hardwareSetIndex, qty, 'checkin')
                    }
                    onCheckOut={(projectId, hardwareSetIndex, qty) =>
                        handleHardwareUpdate(projectId, hardwareSetIndex, qty, 'checkout')
                    }
                />
            ))}

            {/* Floating "Create Project" Button (Bottom Right) */}
            <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={openCreateDialog}
                style={{
                    position: 'fixed',
                    bottom: '16px',
                    right: '16px',
                    width: 'auto',
                    minWidth: 'auto',
                    borderRadius: '24px',
                    padding: '8px 16px'
                }}
            >
                Create Project
            </Button>

            {/* Floating "Log Out" Button (Bottom Left) */}
            <Button
                variant="contained"
                color="secondary"
                onClick={handleLogout}
                style={{
                    position: 'fixed',
                    bottom: '16px',
                    left: '16px',
                    width: 'auto',
                    minWidth: 'auto',
                    borderRadius: '24px',
                    padding: '8px 16px'
                }}
            >
                Log Out
            </Button>

            {/* Create Project Dialog */}
            <Dialog open={createDialogOpen} onClose={closeCreateDialog}>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogContent sx={{ minWidth: '300px' }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Project Name"
                        fullWidth
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Project Description"
                        fullWidth
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                    />
                    <Typography variant="subtitle1" mt={2}>Select Hardware Sets</Typography>
                    <FormGroup>
                        {availableHwsets.map(hw => {
                            const hwId = typeof hw._id === 'object' ? hw._id.$oid || hw._id.toString() : hw._id;
                            return (
                                <FormControlLabel
                                    key={hwId}
                                    control={
                                        <Checkbox
                                            checked={selectedHwsetIds.includes(hwId)}
                                            onChange={() => handleToggleHwset(hwId)}
                                        />
                                    }
                                    label={`${hw.name} (Capacity: ${hw.capacity}, Available: ${hw.available})`}
                                />
                            );
                        })}

                    </FormGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeCreateDialog}>Cancel</Button>
                    <Button onClick={handleCreateProject} variant="contained" color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Projects;
