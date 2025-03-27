import React from 'react';

function HardwareList({ hardwareSets }) {
    return (
        <div>
            <h4>Hardware Sets</h4>
            <ul>
                {hardwareSets.map((hw, index) => (
                    <li key={index}>{hw}</li>
                ))}
            </ul>
        </div>
    );
}

export default HardwareList;