import React, { useState } from 'react';
import ProjectCard from './ProjectCard';

function Projects() {
    const [projects, setProjects] = useState([
        {
            id: 1,
            name: 'Project Name 1',
            hardwareSets: ['HWSet1: 50/100', 'HWSet2: 0/100'],
            authorizedUsers: ['User1', 'User2'],
            joined: false
        },
        {
            id: 2,
            name: 'Project Name 2',
            hardwareSets: ['HWSet1: 25/100'],
            authorizedUsers: ['User1', 'User3'],
            joined: true
        }
    ]);

    const handleToggleJoin = (projectId) => {
        setProjects((prevProjects) =>
            prevProjects.map((project) =>
                project.id === projectId
                    ? { ...project, joined: !project.joined }
                    : project
            )
        );
    };

    // Update only the selected hardware set for the given project.
    const handleHardwareUpdate = (projectId, hardwareSetIndex, qty, type) => {
        setProjects(prevProjects =>
            prevProjects.map(project => {
                if (project.id !== projectId) return project;

                const updatedHardwareSets = project.hardwareSets.map((setString, index) => {
                    if (index !== hardwareSetIndex) return setString;

                    // Assuming format "HWSet1: current/total"
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