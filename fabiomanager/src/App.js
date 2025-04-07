import React from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import MainDashboard from './MainDashboardUpdatedFinal'; 
import Login from './Login';
import Materials from './Materials'; 
import Orders from './Orders'; 
import Users from './Users'; 
import Tasks from './Tasks'; 
import Profile from './Profile'; 

const App = () => { 
    return ( 
        <Router> 
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="dashboard" element={<MainDashboard />} /> 
                <Route path="materials" element={<Materials />} /> 
                <Route path="orders" element={<Orders />} /> 
                <Route path="users" element={<Users />} /> 
                <Route path="tasks" element={<Tasks />} /> 
                <Route path="profile" element={<Profile />} /> 
            </Routes> 
        </Router> 
    ); 
}; 

export default App;
