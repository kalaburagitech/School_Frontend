import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export const socket = io('https://school-backend-61j7.onrender.com'); // Shared socket instance

// ...

const { data } = await axios.post('https://school-backend-61j7.onrender.com/api/auth/login', { email, password }, config);

// Store user info and token separately
const { token, ...userInfo } = data;
localStorage.setItem('userInfo', JSON.stringify(userInfo));
localStorage.setItem('token', token);

// Set axios default authorization header
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

setUser(userInfo);
return { success: true, role: userInfo.role };
        } catch (error) {
    return {
        success: false,
        message: error.response && error.response.data.message
            ? error.response.data.message
            : error.message
    };
}
    };

const logout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
};

// Check if user has specific role(s)
const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
        return roles.includes(user.role);
    }
    return user.role === roles;
};

const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    setUser(updatedUser);
};

return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole, updateUser }}>
        {children}
    </AuthContext.Provider>
);
};

export default AuthContext;
