// Simple heuristic for route optimization (nearest neighbor)
// In production, integrate with a mapping API or ML model

function haversineDistance(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function optimizeRoute(start, stops) {
  const remaining = [...stops];
  const route = [];
  let current = start;
  let totalDistance = 0;

  while (remaining.length) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(current, remaining[i]);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    const next = remaining.splice(bestIndex, 1)[0];
    route.push(next);
    totalDistance += bestDistance;
    current = next;
  }

  return { route, totalDistance };
}

module.exports = { optimizeRoute, haversineDistance };


