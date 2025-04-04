import React, { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';

const API_BASE_URL = "http://localhost:5000";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    // Convert hardware_sets object to an array of strings
                    // e.g. { HWSet1: { available: 50, capacity: 100 }, HWSet2: {...} }
                    // => ["HWSet1: 50/100", "HWSet2: 0/100"]
                    let hardwareSets = [];
                    if (project.hardware_sets) {
                        hardwareSets = Object.entries(project.hardware_sets).map(([setName, setData]) => {
                            const { available, capacity } = setData;
                            return `${setName}: ${available}/${capacity}`;
                        });
                    }

                    return {
                        // Use project._id or project.name or something else as a unique ID
                        id: project._id?.$oid || index,
                        name: project.name,
                        hardwareSets: hardwareSets,
                        authorizedUsers: project.authorized_users || [],
                        // If you want to mark "joined" based on whether the current user is in authorized_users
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

                    // "HWSet1: 50/100" => label="HWSet1", numbers="50/100"
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

    if (loading) {
        return <div>Loading projects...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Projects</h2>
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
        </div>
    );
}

export default Projects;
