import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./UsersTable.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUnlock, faTrash } from "@fortawesome/free-solid-svg-icons";

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      // Query Firestore to order by lastLogin in descending order
      const usersQuery = query(
        collection(db, "users"),
        orderBy("lastLogin", "desc")
      );
      const usersCollection = await getDocs(usersQuery);

      setUsers(
        usersCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };

    fetchUsers();
  }, []);

  // Función para bloquear o desbloquear usuarios seleccionados
  const handleBlockToggle = async (action) => {
    try {
      const newStatus = action === "block" ? "blocked" : "active";
      let sameUser = false; // Inicializa una bandera
  
      for (const userId of selectedUsers) {
        await updateDoc(doc(db, "users", userId), { status: newStatus });
  
        // Marca si el usuario actual está siendo bloqueado
        if (userId === auth.currentUser.uid && newStatus === "blocked") {
          sameUser = true;
        }
      }
  
      // Actualiza los usuarios en el estado
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedUsers.includes(user.id)
            ? { ...user, status: newStatus }
            : user
        )
      );
  
      alert(
        `Users successfully ${action === "block" ? "blocked" : "unblocked"}!`
      );
  
      setSelectedUsers([]); // Limpia la selección
  
      // Si el usuario actual fue bloqueado, cerrar sesión después
      if (sameUser) {
        alert("You have blocked your own account. Logging out...");
        await auth.signOut();
        navigate("/"); // Redirige al login
      }
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
      alert("An error occurred while performing the action.");
    }
  };
  

  // Función para eliminar usuarios seleccionados
  const handleDelete = async () => {
    try {
      let sameUser = false; // Inicializa una bandera
  
      for (const userId of selectedUsers) {
        await deleteDoc(doc(db, "users", userId));
  
        // Marca si el usuario actual está siendo eliminado
        if (userId === auth.currentUser.uid) {
          sameUser = true;
        }
      }
  
      // Actualiza los usuarios en el estado
      setUsers((prevUsers) =>
        prevUsers.filter((user) => !selectedUsers.includes(user.id))
      );
  
      alert("Users successfully deleted!");
      setSelectedUsers([]); // Limpia la selección
  
      // Si el usuario actual fue eliminado, cerrar sesión después
      if (sameUser) {
        alert("You have deleted your own account. Logging out...");
        await auth.signOut();
        navigate("/"); // Redirige al login
      }
    } catch (error) {
      console.error("Error deleting users:", error);
      alert("An error occurred while deleting the users.");
    }
  };
  

  // Función para manejar selección de usuarios
  const handleSelectUser = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  // Función para manejar selección de todos los usuarios
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/"); // Redirige al login después de cerrar sesión
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-light bg-light">
        <div className="container">
          <span className="navbar-brand mb-0 h1">User Management</span>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Toolbar */}
      <div className="toolbar mb-3">
        <button
          className="btn btn-warning me-2"
          onClick={() => handleBlockToggle("block")}
          disabled={selectedUsers.length === 0}
        >
          <FontAwesomeIcon icon={faLock} /> Block
        </button>
        <button
          className="btn btn-success me-2"
          onClick={() => handleBlockToggle("unblock")}
          disabled={selectedUsers.length === 0}
        >
          <FontAwesomeIcon icon={faUnlock} /> Unblock
        </button>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={selectedUsers.length === 0}
        >
          <FontAwesomeIcon icon={faTrash} /> Delete
        </button>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table table-striped table-responsive">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    selectedUsers.length === users.length && users.length > 0
                  }
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>
                Last Login <span>&#8595;</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.status}</td>
                <td>{new Date(user.lastLogin).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
