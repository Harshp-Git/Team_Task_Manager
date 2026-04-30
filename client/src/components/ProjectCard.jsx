import { useNavigate } from 'react-router-dom';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  return (
    <div
      className="card project-card"
      onClick={() => navigate(`/projects/${project._id}`)}
      id={`project-${project._id}`}
    >
      <div className="card-header">
        <h3 className="card-title">{project.name}</h3>
      </div>

      {project.description && (
        <p className="card-description">
          {project.description.length > 100
            ? project.description.slice(0, 100) + '...'
            : project.description}
        </p>
      )}

      <div className="card-footer">
        <div className="project-meta">
          <span className="project-meta-item">
            👤 {project.owner?.name || 'Unknown'}
          </span>
          <span className="project-meta-item">
            👥 {project.members?.length || 0} members
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
