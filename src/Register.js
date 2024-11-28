import React, { useState } from "react";
import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Estado para el nombre
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Verificar si el correo ya existe en Firestore
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(
        query(usersCollection, where("email", "==", email))
      );

      if (!querySnapshot.empty) {
        // Si el correo ya existe en Firestore, mostrar mensaje
        alert("This email is already registered in the system.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Guardar información del usuario en Firestore
      await setDoc(doc(db, "users", user.uid), {
        name, // Guardar el nombre
        email: user.email,
        status: "active",
        lastLogin: new Date().toISOString(),
      });

      alert("User registered successfully!");
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/users");
    } catch (error) {
      // Mapeo de errores comunes
      let errorMessage;
      switch (error.code) {
        case "auth/email-already-in-use":
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCredential.user;
          // Guardar información del usuario en Firestore
          await setDoc(doc(db, "users", user.uid), {
            name, // Guardar el nombre
            email: user.email,
            status: "active",
            lastLogin: new Date().toISOString(),
          });
          alert("User registered successfully!");
          navigate("/users");
          break;
        default:
          errorMessage = "An error occurred. Please try again.";
          alert(errorMessage);
      }
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleRegister}>
        <h2>Register</h2>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          Register
        </button>
        <p className="auth-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/")}>Login here</span>
        </p>
      </form>
    </div>
  );
};

export default Register;
