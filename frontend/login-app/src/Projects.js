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

    return (
        <div>
            <h2>Projects</h2>
            {projects.map((proj) => (
                <ProjectCard
                    key={proj.id}
                    project={proj}
                    onToggleJoin={handleToggleJoin}
                />
            ))}
        </div>
    );
}

export default Projects;