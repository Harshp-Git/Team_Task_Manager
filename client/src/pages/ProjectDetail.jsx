import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import { useToast } from '../context/ToastContext';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedNewMember, setSelectedNewMember] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { fetchProject(); }, [id, user]);

  const fetchProject = async () => {
    try {
      const res = await API.get(`/projects/${id}`);
      setProject(res.data.project);
      setTasks(res.data.tasks);
      const allMembers = [res.data.project.owner, ...(res.data.project.members || [])];
      const unique = allMembers.filter((m, i, arr) => m && arr.findIndex((x) => x._id === m._id) === i);
      setMembers(unique);
      if (user?.role === 'admin') {
        const usersRes = await API.get('/auth/users');
        setAllUsers(usersRes.data);
      }
    } catch (err) {
      showToast('Failed to fetch project.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsSubmittingTask(true);
    try {
      const payload = { title: form.title, description: form.description, priority: form.priority, project: id, assignedTo: form.assignedTo || undefined, dueDate: form.dueDate || undefined };
      const res = await API.post('/tasks', payload);
      setTasks((prev) => [res.data, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
      showToast('Task created successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create task.', 'error');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await API.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      showToast('Failed to update task.', 'error');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      showToast('Task deleted.', 'success');
    } catch (err) {
      showToast('Failed to delete task.', 'error');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedNewMember) return;
    setIsSubmittingMember(true);
    try {
      const res = await API.post(`/projects/${id}/members`, { userId: selectedNewMember });
      setProject(res.data);
      const allMembers = [res.data.owner, ...(res.data.members || [])];
      const unique = allMembers.filter((m, i, arr) => m && arr.findIndex((x) => x._id === m._id) === i);
      setMembers(unique);
      setSelectedNewMember('');
      showToast('Member added successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add member.', 'error');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      const res = await API.delete(`/projects/${id}/members/${userId}`);
      setProject(res.data);
      const allMembers = [res.data.owner, ...(res.data.members || [])];
      const unique = allMembers.filter((m, i, arr) => m && arr.findIndex((x) => x._id === m._id) === i);
      setMembers(unique);
      showToast('Member removed successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove member.', 'error');
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  const availableUsersToAdd = allUsers.filter(u => !members.some(m => m._id === u._id));
  const canUpdate = (task) => user?.role === 'admin' || user?.id === task.assignedTo?._id;
  const avatarColors = ['#6c63ff','#43e97b','#f7971e','#ff6b6b','#818cf8','#38f9d7','#a78bfa','#ffd200'];

  if (loading) {
    return (<div className="app-layout"><Sidebar /><div className="main-area"><div className="loading"><div className="spinner"></div></div></div></div>);
  }

  if (!project) {
    return (
      <div className="app-layout"><Sidebar /><div className="main-area"><div className="main-content">
        <div className="empty-state"><div className="empty-state-title">Project not found</div>
        <Link to="/projects" className="btn btn-primary" style={{marginTop:16}}>Back to Projects</Link></div>
      </div></div></div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <div className="topbar">
          <div className="topbar-title">{project.name}</div>
          <div className="topbar-actions">
            {user?.role === 'admin' && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)} id="create-task-btn">+ New Task</button>
            )}
          </div>
        </div>
        <div className="main-content">
          <Link to="/projects" className="back-link">← Back to Projects</Link>

          {project.description && <p className="page-subtitle" style={{marginBottom:16}}>{project.description}</p>}

          {/* Members Panel */}
          <div className="members-panel">
            <div className="section-card-header">
              <div className="section-card-title">Team Members</div>
              <div className="section-card-count">{members.length}</div>
            </div>
            <div className="member-list">
              {members.map((m, i) => (
                <div key={m._id} className="member-row">
                  <div className="member-info">
                    <div className="member-avatar" style={{background: avatarColors[i % avatarColors.length]}}>{m.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="member-name">{m.name}{project.owner._id === m._id && <span className="owner-badge">Owner</span>}</div>
                      <div className="member-email">{m.email}</div>
                    </div>
                  </div>
                  {user?.role === 'admin' && project.owner._id !== m._id && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m._id)}>Remove</button>
                  )}
                </div>
              ))}
            </div>
            {user?.role === 'admin' && availableUsersToAdd.length > 0 && (
              <form className="member-add-row" onSubmit={handleAddMember}>
                <select className="form-select" value={selectedNewMember} onChange={(e) => setSelectedNewMember(e.target.value)} required>
                  <option value="">Select a user to add...</option>
                  {availableUsersToAdd.map(u => (<option key={u._id} value={u._id}>{u.name} ({u.email})</option>))}
                </select>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingMember}>{isSubmittingMember ? 'Adding...' : 'Add Member'}</button>
              </form>
            )}
          </div>

          {/* Filters */}
          <div className="filters">
            {['all', 'todo', 'in-progress', 'done'].map((f) => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? `All (${tasks.length})` : `${f} (${tasks.filter((t) => t.status === f).length})`}
              </button>
            ))}
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📝</div><div className="empty-state-title">No tasks found</div><p>Create a task to get started</p></div>
          ) : (
            <div className="section-card">
              {filteredTasks.map((task) => (
                <div className="task-item" key={task._id}>
                  <div className={`priority-dot ${task.priority}`}></div>
                  <div className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                    onClick={() => canUpdate(task) && handleStatusChange(task._id, task.status === 'done' ? 'todo' : 'done')}
                    style={{cursor: canUpdate(task) ? 'pointer' : 'default'}}></div>
                  <span className={`task-name ${task.status === 'done' ? 'done' : ''}`}>
                    {task.title}
                    {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' && <span className="overdue-badge">Overdue</span>}
                  </span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  {task.assignedTo && (
                    <div className="task-assignee" style={{background: avatarColors[task.assignedTo.name?.charCodeAt(0) % avatarColors.length]}}>
                      {task.assignedTo.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {task.dueDate && <span style={{fontSize:'.7rem',color:'var(--text3)'}}>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                  {canUpdate(task) && (
                    <div className="task-actions-mini">
                      <select value={task.status} onChange={(e) => handleStatusChange(task._id, e.target.value)}>
                        <option value="todo">Todo</option><option value="in-progress">In Progress</option><option value="done">Done</option>
                      </select>
                    </div>
                  )}
                  {user?.role === 'admin' && (
                    <div className="task-actions-mini">
                      <button onClick={() => handleDelete(task._id)}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Task</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group"><label className="form-label" htmlFor="task-title">Title</label><input id="task-title" className="form-input" type="text" placeholder="e.g. Design homepage" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label" htmlFor="task-desc">Description</label><textarea id="task-desc" className="form-input form-textarea" placeholder="Task details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-group"><label className="form-label" htmlFor="task-priority">Priority</label><select id="task-priority" className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              <div className="form-group"><label className="form-label" htmlFor="task-assign">Assign To</label><select id="task-assign" className="form-select" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}><option value="">Unassigned</option>{members.map((m) => (<option key={m._id} value={m._id}>{m.name} ({m.email})</option>))}</select></div>
              <div className="form-group"><label className="form-label" htmlFor="task-due">Due Date</label><input id="task-due" className="form-input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSubmittingTask}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingTask}>{isSubmittingTask ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
