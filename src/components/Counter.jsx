import "./Counter.css";

export default function Counter({ points, voltorbs, icon }) {
  return (
    <div className="stat-counter">
      <div className="stat-counter__bands">
        <span className="stat-counter__band stat-counter__band--points">
          {String(points).padStart(2, "0")}
        </span>
        <span className="stat-counter__band stat-counter__band--voltorbs">
          {icon && <img src={icon} alt="" className="stat-counter__voltorb-icon" />}
          {voltorbs}
        </span>
      </div>
    </div>
  );
}