import React, { useState, useEffect, useCallback } from 'react';
import ProjectCard from './ProjectCard';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    FormGroup,
    FormControlLabel,
    Checkbox
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

    // Define fetchProjects as a reusable function using useCallback
    const fetchProjects = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }
            const data = await response.json();
            const username = localStorage.getItem('username');

            const transformedProjects = data.map((project) => {
                // Map the joined hwset details from the backend (using the field "hwsets")
                const hardwareSets = (project.hwsets || []).map(hw => ({
                    hwset_id: hw.hwset_id,
                    name: hw.name,
                    available: hw.available ?? 0,
                    capacity: hw.capacity ?? 0,
                }));

                return {
                    id: project._id || project.id, // backend already converts _id to string
                    name: project.name,
                    description: project.description || "",
                    hardwareSets: hardwareSets,
                    authorizedUsers: project.authorized_users || [],
                    joined: (project.authorized_users || []).includes(username)
                };
            });

            setProjects(transformedProjects);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and polling every 5 seconds
    useEffect(() => {
        fetchProjects(); // initial load
        const intervalId = setInterval(fetchProjects, 5000);
        return () => clearInterval(intervalId);
    }, [fetchProjects]);

    // Fetch global hardware sets when the Create Project dialog is open
    useEffect(() => {
        async function fetchHwsets() {
            try {
                const response = await fetch(`${API_BASE_URL}/projects/hwsets`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                const data = await response.json();
                setAvailableHwsets(data);
            } catch (err) {
                console.error("Error fetching hwsets:", err);
            }
        }
        if (createDialogOpen) fetchHwsets();
    }, [createDialogOpen]);

    const handleToggleHwset = (id) => {
        const stringId = id.toString();
        setSelectedHwsetIds(prev =>
            prev.includes(stringId)
                ? prev.filter(hid => hid !== stringId)
                : [...prev, stringId]
        );
    };

    // Use fetchProjects() as the callback for join/leave and checkin/checkout actions
    const handleToggleJoin = async () => {
        await fetchProjects();
    };

    // --------------- Create Project Dialog Handlers ---------------
    const openCreateDialog = () => {
        setCreateDialogOpen(true);
    };

    const closeCreateDialog = () => {
        setProjectName("");
        setProjectDescription("");
        setSelectedHwsetIds([]);
        setCreateDialogOpen(false);
    };

    const handleCreateProject = async () => {
        try {
            // For now, send selectedHwsetIds (list of string IDs) as hardware_sets.
            // (Ensure your backend expects this format and performs necessary lookups.)
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
                    hardware_sets
                })
            });

            if (!response.ok) {
                const errMsg = await response.json();
                throw new Error(errMsg.error || 'Error creating project');
            }

            // Refresh the projects list after creation
            await fetchProjects();

            // Clear state and close dialog
            closeCreateDialog();
        } catch (error) {
            console.error("Failed to create project:", error);
            alert(error.message);
        }
    };

    // --------------- Log Out Handler ---------------
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/';
    };

    if (loading) {
        return <div>Loading projects...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div style={{ marginTop: '50px', minHeight: '100vh' }}>
            <Typography variant="h4" style={{ marginBottom: '16px' }}>
                Projects
            </Typography>

            {projects.map((proj, index) => (
                <div key={proj.id} style={{ marginTop: index === 0 ? '50px' : '0' }}>
                    <ProjectCard
                        project={proj}
                        onToggleJoin={async () => { await fetchProjects(); }}
                        onCheckIn={async () => { await fetchProjects(); }}
                        onCheckOut={async () => { await fetchProjects(); }}
                    />
                </div>
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
                    <Typography variant="subtitle1" mt={2}>
                        Select Hardware Sets
                    </Typography>
                    <FormGroup>
                        {availableHwsets.map(hw => {
                            const hwId = typeof hw._id === 'object'
                                ? hw._id.$oid || hw._id.toString()
                                : hw._id;
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
