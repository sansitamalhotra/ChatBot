
// frontend/src/components/GuestUserForm.jsx
import React, { useState } from 'react';
import API from '../../helpers/API';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const GuestUserForm = () => {
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');


    const notifyErr = (msg) => toast.error(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});
    const notifySucc = (msg) => toast.success(msg, 
        {position: "top-center", autoClose: 20000, closeOnClick: true, pauseOnHover: true, theme: "light",});

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await API.post('/api/v1/guestUsers/create-guest-user', { firstName, lastName, email, phone });
            console.log('Guest user created:', response.data);
            notifySucc('Guest user created:', response.data);
        } catch (error) {
            notifyErr('Error creating guest user. Please try again.', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button type="submit">Submit</button>
        </form>
    );
};

export default GuestUserForm;
