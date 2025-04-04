import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Button,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';

// Update this base URL to match your Flask deployment (or localhost for testing)
const API_BASE_URL = "http://localhost:5000";

function ProjectCard({ project, onToggleJoin, onCheckIn, onCheckOut }) {
    const { id, name, hardwareSets, joined } = project;
    const [quantity, setQuantity] = useState(0);
    const [selectedHardwareSet, setSelectedHardwareSet] = useState(0); // default selection is the first hardware set

    const handleQuantityChange = (e) => {
        setQuantity(Number(e.target.value));
    };

    const handleHardwareSetChange = (e) => {
        setSelectedHardwareSet(e.target.value);
    };

    const handleCheckIn = async () => {
        const url = `${API_BASE_URL}/checkin?projectId=${id}&qty=${quantity}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            alert(data.message); // Pop-up: "<qty> hardware checked in"
            onCheckIn(id, selectedHardwareSet, quantity);
        } catch (error) {
            console.error("Error checking in hardware:", error);
        }
    };

    const handleCheckOut = async () => {
        const url = `${API_BASE_URL}/checkout?projectId=${id}&qty=${quantity}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            alert(data.message); // Pop-up: "<qty> hardware checked out"
            onCheckOut(id, selectedHardwareSet, quantity);
        } catch (error) {
            console.error("Error checking out hardware:", error);
        }
    };

    const handleJoinLeave = async () => {
        const endpoint = joined ? 'leave' : 'join';
        const url = `${API_BASE_URL}/${endpoint}?projectId=${id}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            alert(data.message); // Pop-up: "Joined <projectId>" or "Left <projectId>"
            onToggleJoin(id);
        } catch (error) {
            console.error(`Error trying to ${joined ? 'leave' : 'join'} project:`, error);
        }
    };

    return (
        <Card sx={{ marginBottom: '16px' }}>
            <CardContent>
                <Typography variant="h5" component="div">
                    {name}
                </Typography>

                {/* Dropdown for selecting a hardware set */}
                <FormControl fullWidth margin="normal">
                    <InputLabel id={`hardware-set-label-${id}`}>Select Hardware Set</InputLabel>
                    <Select
                        labelId={`hardware-set-label-${id}`}
                        value={selectedHardwareSet}
                        label="Select Hardware Set"
                        onChange={handleHardwareSetChange}
                    >
                        {hardwareSets.map((set, index) => {
                            // Extract the label before the colon, e.g., "HWSet1"
                            const label = set.split(':')[0];
                            return (
                                <MenuItem key={index} value={index}>
                                    {label}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>

                {/* Optionally display details for the selected hardware set */}
                <Typography variant="body2">
                    {hardwareSets[selectedHardwareSet]}
                </Typography>

                <div style={{ marginTop: '16px' }}>
                    <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={handleQuantityChange}
                        margin="normal"
                        variant="outlined"
                        size="small"
                    />
                </div>
            </CardContent>
            <CardActions>
                <Button variant="contained" color="primary" onClick={handleCheckIn}>
                    Check In
                </Button>
                <Button variant="contained" color="secondary" onClick={handleCheckOut} style={{ marginLeft: '8px' }}>
                    Check Out
                </Button>
                <Button variant="contained" onClick={handleJoinLeave} style={{ marginLeft: '8px' }}>
                    {joined ? 'Leave' : 'Join'}
                </Button>
            </CardActions>
        </Card>
    );
}

export default ProjectCard;