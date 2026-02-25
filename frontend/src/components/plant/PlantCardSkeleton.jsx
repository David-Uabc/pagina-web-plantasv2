// Skeleton de una PlantCard mientras carga
function PlantCardSkeleton() {
  return (
    <div className="plant-card skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="card-header">
        <div className="skeleton skeleton-text" style={{ width: "60%", height: 16 }} />
        <div className="skeleton skeleton-badge" />
      </div>
      <div style={{ padding: "4px 16px 8px" }}>
        <div className="skeleton skeleton-text" style={{ width: "80%", height: 12, marginBottom: 8 }} />
        <div className="skeleton skeleton-bar" />
      </div>
      <div className="card-actions">
        <div className="skeleton skeleton-btn" />
        <div className="skeleton skeleton-btn" />
      </div>
    </div>
  );
}

// Grid de skeletons — muestra N placeholders
export function PlantGridSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PlantCardSkeleton key={i} />
      ))}
    </>
  );
}

export default PlantCardSkeleton;