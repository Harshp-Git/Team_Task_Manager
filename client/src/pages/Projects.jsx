import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import ProjectCard from '../components/ProjectCard';
import { useToast } from '../context/ToastContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch (err) {
      showToast('Failed to fetch projects.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    setShowModal(true);
    setForm({ name: '', description: '' });
    setSelectedMembers([]);
    try {
      const res = await API.get('/auth/users');
      setAllUsers(res.data.filter((u) => u._id !== user?.id));
    } catch (err) {
      showToast('Failed to load users for assignment.', 'error');
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await API.post('/projects', { ...form, members: selectedMembers });
      setProjects((prev) => [res.data, ...prev]);
      setShowModal(false);
      showToast('Project created successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create project.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar projectCount={0} />
        <div className="main-area"><div className="loading"><div className="spinner"></div></div></div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar projectCount={projects.length} />
      <div className="main-area">
        <div className="topbar">
          <div className="topbar-title">Projects</div>
          <div className="topbar-actions">
            {user?.role === 'admin' && (
              <button className="btn btn-primary" onClick={openCreateModal} id="create-project-btn">+ New Project</button>
            )}
          </div>
        </div>
        <div className="main-content">
          <div className="page-header">
            <div>
              <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <div className="empty-state-title">No projects yet</div>
              <p>{user?.role === 'admin' ? 'Create your first project to get started.' : 'No projects assigned to you yet.'}</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="project-name">Project Name</label>
                <input id="project-name" className="form-input" type="text" placeholder="e.g. Website Redesign" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="project-desc">Description</label>
                <textarea id="project-desc" className="form-input form-textarea" placeholder="What is this project about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Members</label>
                {selectedMembers.length > 0 && (
                  <div className="member-chips">
                    {selectedMembers.map((id) => {
                      const u = allUsers.find((u) => u._id === id);
                      return u ? (<span key={id} className="member-chip">{u.name}<button type="button" onClick={() => toggleMember(id)}>✕</button></span>) : null;
                    })}
                  </div>
                )}
                <div className="checkbox-list" style={{ marginTop: '8px' }}>
                  {allUsers.length === 0 ? (
                    <div style={{ padding: '8px', color: 'var(--text3)', fontSize: '.8rem' }}>No users available</div>
                  ) : (
                    allUsers.map((u) => (
                      <label key={u._id} className="checkbox-item">
                        <input type="checkbox" checked={selectedMembers.includes(u._id)} onChange={() => toggleMember(u._id)} />
                        <span>{u.name}</span>
                        <span style={{ color: 'var(--text3)', fontSize: '.7rem' }}>{u.email}</span>
                        <span className={`badge badge-${u.role}`} style={{ marginLeft: 'auto' }}>{u.role}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
