import React, { useState } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Archivo CSS para estilo adicional
import { updateDoc } from "firebase/firestore";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Verificar si el correo ya existe en Firestore
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(
        query(usersCollection, where("email", "==", email))
      );

      if (querySnapshot.empty) {
        // Si el correo ya existe en Firestore, mostrar mensaje
        alert("No account found with this email.");
        return;
      }


      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status === "blocked") {
          alert("User is blocked. Please contact admin.");
          await auth.signOut();
        } else {
          // Actualizar el último inicio de sesión
          await updateDoc(userRef, {
            lastLogin: new Date().toISOString(),
          });
          alert("Login successful!");
          navigate("/users");
        }
      }
    } catch (error) {
      // Mapeo de errores comunes
      let errorMessage;
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Invalid credentials.";
          break;
        case "auth/invalid-credential":
          errorMessage = "Invalid credentials.";
          break;
        default:
          errorMessage = "An error occurred. Please try again.";
      }
  
      alert(errorMessage);
    }
  };
  
  

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2>Login</h2>
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
        <button type="submit" className="btn btn-primary btn-block">Login</button>
        <p className="auth-link">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")}>Register here</span>
        </p>
      </form>
    </div>
  );
};

export default Login;
