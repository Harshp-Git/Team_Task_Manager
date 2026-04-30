import { useAuth } from '../context/AuthContext';

export default function TaskCard({ task, onStatusChange, onDelete }) {
  const { user } = useAuth();

  const statusOptions = ['todo', 'in-progress', 'done'];

  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  
  // Check if current user can update the task (admin or assigned member)
  const canUpdate = user?.role === 'admin' || user?.id === task.assignedTo?._id;

  return (
    <div className="task-card" id={`task-${task._id}`}>
      <div className="task-info">
        <div className="task-title">
          {task.title}
          {isOverdue && <span className="badge badge-high" style={{ marginLeft: 8 }}>Overdue</span>}
        </div>
        <div className="task-meta">
          <span className={`badge badge-${task.status}`}>
            {task.status}
          </span>
          <span className={`badge badge-${task.priority}`}>
            {task.priority}
          </span>
          {task.assignedTo && (
            <span>→ {task.assignedTo.name}</span>
          )}
          {task.dueDate && (
            <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      <div className="task-actions">
        {canUpdate && (
          <select
            className="form-select"
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.75rem' }}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {user?.role === 'admin' && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(task._id)}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
