import React, { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography
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
    const [hwSetName, setHwSetName] = useState("");
    const [hwSetCapacity, setHwSetCapacity] = useState("");

    // Fetch projects from your Flask backend on mount
    useEffect(() => {
        async function fetchProjects() {
            try {
                const response = await fetch(`${API_BASE_URL}/projects`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`, // JWT token if required
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch projects');
                }

                // The backend returns an array of project documents
                const data = await response.json();

                // Transform each project to match what your UI expects
                const username = localStorage.getItem('username'); // if you store the logged-in username
                const transformedProjects = data.map((project, index) => {
                    let hardwareSets = [];
                    if (project.hardware_sets) {
                        hardwareSets = Object.entries(project.hardware_sets).map(([setName, setData]) => {
                            const { available, capacity } = setData;
                            return `${setName}: ${available}/${capacity}`;
                        });
                    }

                    return {
                        id: project._id?.$oid || index,
                        name: project.name,
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
                    const [label, numbers] = setString.split(':').map(s => s.trim());
                    let [current, total] = numbers.split('/').map(Number);
                    if (type === 'checkin') {
                        current = Math.min(total, current + qty);
                    } else if (type === 'checkout') {
                        current = Math.max(0, current - qty);
                    }
                    return `${label}: ${current}/${total}`;
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
        setHwSetName("");
        setHwSetCapacity("");
        setCreateDialogOpen(false);
    };

    const handleCreateProject = async () => {
        try {
            // Build hardware_sets object from dialog fields (for one hardware set)
            const hardwareSets = {};
            if (hwSetName && hwSetCapacity) {
                hardwareSets[hwSetName] = {
                    available: 0,
                    capacity: parseInt(hwSetCapacity, 10)
                };
            }

            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: projectName,
                    hardware_sets: hardwareSets
                })
            });

            if (!response.ok) {
                const errMsg = await response.json();
                throw new Error(errMsg.error || 'Error creating project');
            }

            // On success, close dialog and refresh the project list
            closeCreateDialog();
            const newResponse = await fetch(`${API_BASE_URL}/projects`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
            });
            const newData = await newResponse.json();
            const username = localStorage.getItem('username');
            const transformedProjects = newData.map((project, index) => {
                let hardwareSets = [];
                if (project.hardware_sets) {
                    hardwareSets = Object.entries(project.hardware_sets).map(([setName, setData]) => {
                        const { available, capacity } = setData;
                        return `${setName}: ${available}/${capacity}`;
                    });
                }
                return {
                    id: project._id?.$oid || index,
                    name: project.name,
                    hardwareSets: hardwareSets,
                    authorizedUsers: project.authorized_users || [],
                    joined: (project.authorized_users || []).includes(username),
                };
            });
            setProjects(transformedProjects);
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
                        label="Hardware Set Name"
                        fullWidth
                        value={hwSetName}
                        onChange={(e) => setHwSetName(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Hardware Set Capacity"
                        type="number"
                        fullWidth
                        value={hwSetCapacity}
                        onChange={(e) => setHwSetCapacity(e.target.value)}
                    />
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
