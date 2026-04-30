import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, taskRes] = await Promise.all([
          API.get('/projects'),
          API.get('/tasks'),
        ]);
        setProjects(projRes.data);
        setTasks(taskRes.data);
      } catch (err) {
        showToast('Failed to load dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await API.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
      showToast('Task status updated.', 'success');
    } catch (err) {
      showToast('Failed to update task.', 'error');
    }
  };

  const toggleDone = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    handleStatusChange(taskId, newStatus);
  };

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');

  // Collect unique members from all projects
  const allMembers = [];
  const seenIds = new Set();
  projects.forEach(p => {
    [p.owner, ...(p.members || [])].forEach(m => {
      if (m && !seenIds.has(m._id)) { seenIds.add(m._id); allMembers.push(m); }
    });
  });

  const avatarColors = ['#6c63ff','#43e97b','#f7971e','#ff6b6b','#818cf8','#38f9d7','#a78bfa','#ffd200'];
  const canUpdate = (task) => user?.role === 'admin' || user?.id === task.assignedTo?._id;

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar projectCount={0} taskCount={0} />
        <div className="main-area"><div className="loading"><div className="spinner"></div></div></div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar projectCount={projects.length} taskCount={tasks.length} />
      <div className="main-area">
        <div className="topbar">
          <div>
            <div className="topbar-title">Welcome back, {user?.name} 👋</div>
          </div>
          <div className="topbar-actions">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search tasks..." />
            </div>
          </div>
        </div>

        <div className="main-content">
          {/* Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card purple">
              <div className="stat-ghost">📁</div>
              <div className="stat-label">Total Projects</div>
              <div className="stat-value">{projects.length}</div>
              <div className="stat-trend">{projects.length} active</div>
            </div>
            <div className="stat-card red">
              <div className="stat-ghost">📋</div>
              <div className="stat-label">To Do</div>
              <div className="stat-value">{todoTasks.length}</div>
              <div className="stat-trend">Pending tasks</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-ghost">⏳</div>
              <div className="stat-label">In Progress</div>
              <div className="stat-value">{inProgressTasks.length}</div>
              <div className="stat-trend">Being worked on</div>
            </div>
            <div className="stat-card green">
              <div className="stat-ghost">✅</div>
              <div className="stat-label">Completed</div>
              <div className="stat-value">{doneTasks.length}</div>
              <div className="stat-trend">{tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0}% completion</div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="dash-grid">
            {/* Task List */}
            <div className="section-card" style={{animationDelay:'.2s'}}>
              <div className="section-card-header">
                <div className="section-card-title">Recent Tasks</div>
                <div className="section-card-count">{tasks.length} total</div>
              </div>
              {tasks.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📝</div><div className="empty-state-title">No tasks yet</div></div>
              ) : (
                tasks.slice(0, 8).map((task) => (
                  <div className="task-item" key={task._id}>
                    <div className={`priority-dot ${task.priority}`}></div>
                    <div
                      className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                      onClick={() => canUpdate(task) && toggleDone(task._id)}
                      style={{ cursor: canUpdate(task) ? 'pointer' : 'default' }}
                    ></div>
                    <span className={`task-name ${task.status === 'done' ? 'done' : ''}`}>
                      {task.title}
                      {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' && (
                        <span className="overdue-badge">Overdue</span>
                      )}
                    </span>
                    <span className={`badge badge-${task.status}`}>{task.status}</span>
                    {task.assignedTo && (
                      <div className="task-assignee" style={{background: avatarColors[task.assignedTo.name?.charCodeAt(0) % avatarColors.length]}}>
                        {task.assignedTo.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {canUpdate(task) && (
                      <div className="task-actions-mini">
                        <select value={task.status} onChange={(e) => handleStatusChange(task._id, e.target.value)}>
                          <option value="todo">Todo</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Right Column */}
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              {/* Team Members */}
              <div className="section-card" style={{animationDelay:'.25s'}}>
                <div className="section-card-header">
                  <div className="section-card-title">Team Members</div>
                  <div className="section-card-count">{allMembers.length}</div>
                </div>
                {allMembers.slice(0, 5).map((m, i) => (
                  <div className="team-member" key={m._id}>
                    <div className="team-avatar" style={{background: avatarColors[i % avatarColors.length]}}>
                      {m.name?.charAt(0).toUpperCase()}
                      <span className={`online-dot ${i < 3 ? 'online' : 'offline'}`}></span>
                    </div>
                    <div>
                      <div className="team-name">{m.name}</div>
                      <div className="team-role">{m.role || 'Member'}</div>
                    </div>
                    <div className="team-tasks">{tasks.filter(t => t.assignedTo?._id === m._id).length} tasks</div>
                  </div>
                ))}
                {allMembers.length === 0 && <div style={{fontSize:'.8rem',color:'var(--text3)',padding:'10px 0'}}>No team members found</div>}
              </div>

              {/* Project Progress */}
              <div className="section-card" style={{animationDelay:'.3s'}}>
                <div className="section-card-header">
                  <div className="section-card-title">Project Progress</div>
                </div>
                {projects.slice(0, 4).map((p, i) => {
                  const pTasks = tasks.filter(t => t.project === p._id || t.project?._id === p._id);
                  const pDone = pTasks.filter(t => t.status === 'done').length;
                  const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                  const colors = ['purple', 'green', 'yellow', 'red'];
                  return (
                    <div className="progress-item" key={p._id}>
                      <div className="progress-header">
                        <span className="progress-name">{p.name}</span>
                        <span className="progress-pct">{pct}%</span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-fill ${colors[i % colors.length]}`} style={{width: `${pct}%`}}></div>
                      </div>
                    </div>
                  );
                })}
                {projects.length === 0 && <div style={{fontSize:'.8rem',color:'var(--text3)',padding:'10px 0'}}>No projects yet</div>}
              </div>
            </div>

            {/* Overdue Tasks - Full Width */}
            {overdueTasks.length > 0 && (
              <div className="section-card dash-full" style={{animationDelay:'.35s'}}>
                <div className="section-card-header">
                  <div className="section-card-title" style={{color:'var(--danger)'}}>⚠️ Overdue Tasks</div>
                  <div className="section-card-count" style={{background:'rgba(255,107,107,.15)',color:'var(--danger)'}}>{overdueTasks.length}</div>
                </div>
                {overdueTasks.map(task => {
                  const daysLate = Math.ceil((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
                  return (
                    <div className="task-item" key={task._id}>
                      <div className="priority-dot high"></div>
                      <span className="task-name">{task.title}</span>
                      <span className="overdue-badge">{daysLate}d late</span>
                      {task.assignedTo && <span style={{fontSize:'.72rem',color:'var(--text3)'}}>→ {task.assignedTo.name}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
