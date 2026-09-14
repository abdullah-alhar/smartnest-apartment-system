import { useState } from "react";
import { registerUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
    city: "",
    postalCode: "",
    street: "",
    nic: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await registerUser(formData);
      login(data.token);
      setMessage("Registered successfully! Token received.");
    } catch (error) {
      setMessage("Registration failed. Check console for details.");
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="firstName" placeholder="First Name" onChange={handleChange} />
        <input name="lastName" placeholder="Last Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} />
        <input name="contactNumber" placeholder="Contact Number" onChange={handleChange} />
        <input name="city" placeholder="City" onChange={handleChange} />
        <input name="postalCode" placeholder="Postal Code" onChange={handleChange} />
        <input name="street" placeholder="Street" onChange={handleChange} />
        <input name="nic" placeholder="NIC" onChange={handleChange} />
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;