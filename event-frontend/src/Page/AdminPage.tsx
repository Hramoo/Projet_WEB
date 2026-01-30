import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type UserRow = {
  id: number;
  username: string;
  role: "user" | "admin";
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [allowed, setAllowed] = useState<boolean | null>(null); // null = loading
  const [users, setUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const authFetch = useCallback(
    async (input: RequestInfo, init: RequestInit = {}) => {
      const t = localStorage.getItem("token");
      if (!t) {
        navigate("/login");
        return null;
      }

      const res = await fetch(input, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${t}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return null;
      }

      return res;
    },
    [navigate]
  );

  // ✅ gate admin (UX)
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    (async () => {
      const res = await authFetch("/api/validate");
      if (!res) return;

      const data = await safeJson(res);
      if (!res.ok) {
        navigate("/login");
        return;
      }

      const isAdmin = data?.user?.role === "admin";
      setAllowed(isAdmin);

      if (!isAdmin) {
        navigate("/");
      }
    })();
  }, [authFetch, navigate, token]);

  const loadUsers = useCallback(async () => {
    setMessage("");
    setLoadingUsers(true);

    const res = await authFetch("/api/admin/users");
    if (!res) {
      setLoadingUsers(false);
      return;
    }

    const data = await safeJson(res);

    if (!res.ok) {
      // ✅ sécurité: si pas admin -> 403
      setMessage(data?.error || "Erreur");
      setLoadingUsers(false);
      return;
    }

    setUsers(Array.isArray(data) ? (data as UserRow[]) : []);
    setLoadingUsers(false);
  }, [authFetch]);

  useEffect(() => {
    if (allowed === true) loadUsers();
  }, [allowed, loadUsers]);

  const updateRole = useCallback(
    async (u: UserRow, nextRole: "user" | "admin") => {
      setMessage("");

      const res = await authFetch(`/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res) return;

      const data = await safeJson(res);

      if (!res.ok) {
        setMessage(data?.error || "Erreur");
        return;
      }

      setUsers((prev) => prev.map((x) => (x.id === u.id ? data : x)));
    },
    [authFetch]
  );

  const deleteUser = useCallback(
    async (u: UserRow) => {
      setMessage("");
      const ok = window.confirm(`Supprimer "${u.username}" (id=${u.id}) ?`);
      if (!ok) return;

      const res = await authFetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (!res) return;

      const data = await safeJson(res);

      if (!res.ok) {
        setMessage(data?.error || "Erreur");
        return;
      }

      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    },
    [authFetch]
  );

  // Pendant le check admin
  if (allowed === null) {
    return (
      <div className="page">
        <p>Chargement...</p>
      </div>
    );
  }

  // Si pas admin (normalement déjà redirigé)
  if (allowed === false) return null;

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Admin</h1>
        <div className="actions">
          <button className="btn soft" onClick={() => navigate("/")}>
            Retour
          </button>
          <button className="btn soft" onClick={loadUsers}>
            Rafraîchir
          </button>
        </div>
      </header>

      {message && <p className="message">{message}</p>}

      {loadingUsers ? (
        <p>Chargement des utilisateurs...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 12 }}>ID</th>
                <th style={{ padding: 12 }}>Username</th>
                <th style={{ padding: 12 }}>Role</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #eef2f7" }}>
                  <td style={{ padding: 12, fontWeight: 800 }}>{u.id}</td>
                  <td style={{ padding: 12 }}>{u.username}</td>
                  <td style={{ padding: 12 }}>
                    <span className="badge">{u.role}</span>
                  </td>
                  <td style={{ padding: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {u.role === "admin" ? (
                      <button className="btn soft" onClick={() => updateRole(u, "user")}>
                        Passer user
                      </button>
                    ) : (
                      <button className="btn soft" onClick={() => updateRole(u, "admin")}>
                        Passer admin
                      </button>
                    )}

                    <button className="btn icon danger" onClick={() => deleteUser(u)} title="Supprimer">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td style={{ padding: 12 }} colSpan={4}>
                    Aucun utilisateur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
