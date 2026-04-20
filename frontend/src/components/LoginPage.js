import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/api/login', {
                username,
                password
            });

            if (response.data.access_token) {
                localStorage.setItem('timali_token', response.data.access_token);
                localStorage.setItem('timali_user', response.data.username);
                navigate('/'); // Vai para o Dashboard
            }
        } catch (err) {
            setError('Falha no login. Verifique o utilizador e a senha.');
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Login Timali</h2>
            <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left', border: '1px solid #ccc', padding: '20px' }}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div>
                    <label>Utilizador:</label><br/>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label>Senha:</label><br/>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: 'blue', color: 'white' }}>
                    Entrar
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
