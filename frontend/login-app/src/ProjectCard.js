import React, { useState } from 'react';
import { Card, CardContent, CardActions, Button, Typography, TextField } from '@mui/material';
import HardwareList from './HardwareList';

function ProjectCard({ project, onToggleJoin }) {
    const { id, name, hardwareSets, joined } = project;

    const [quantity, setQuantity] = useState(0);

    const handleQuantityChange = (e) => {
        setQuantity(Number(e.target.value));
    };

    const handleCheckIn = () => {
        console.log(`Check In clicked. Quantity: ${quantity}`);
        // Add your Check In logic here
    };

    const handleCheckOut = () => {
        console.log(`Check Out clicked. Quantity: ${quantity}`);
    };

    return (
        <Card sx={{ marginBottom: '16px' }}>
            <CardContent>
                <Typography variant="h5" component="div">
                    {name}
                </Typography>
                <HardwareList hardwareSets={hardwareSets} />

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
                <Button variant="contained" onClick={() => onToggleJoin(id)} style={{ marginLeft: '8px' }}>
                    {joined ? 'Leave' : 'Join'}
                </Button>
            </CardActions>
        </Card>
    );
}

export default ProjectCard;