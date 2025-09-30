// Unified type definitions for the Van Mitra FRA System

// Main FRA Claim interface (used in the main system)
export interface FRAClaim {
  id: number;
  claimantName: string;
  pattaNumber: string;
  extent: number;
  village: string;
  status: 'pending' | 'approved' | 'review';
  confidence: number;
  lat: number;
  lng: number;
  documents: string[];
  aiValidation: { [k: string]: number };
}

// Map-specific claim interface (for visualization)
export interface MapClaim {
  id: string;
  claimantName: string;
  village: string;
  extent: number;
  status: 'pending' | 'approved' | 'rejected' | 'under-review';
  lat: number;
  lng: number;
  pattaNumber: string;
}

// Forest area interface for map visualization
export interface ForestArea {
  id: string;
  name: string;
  type: 'protected' | 'reserve' | 'community';
  area: number;
  coordinates: [number, number][];
  description: string;
  biodiversityIndex: number;
  carbonStock: number;
  threats: string[];
  lastSurvey: string;
  conservationStatus: 'excellent' | 'good' | 'moderate' | 'poor';
  managementPlan: string;
  keySpecies: string[];
  localCommunities: number;
}

// Chart data interfaces
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface KPIMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  color: 'success' | 'warning' | 'danger' | 'info';
}

// Type converters
export const convertFRAClaimToMapClaim = (fraClaim: FRAClaim): MapClaim => ({
  id: fraClaim.id.toString(),
  claimantName: fraClaim.claimantName,
  village: fraClaim.village,
  extent: fraClaim.extent,
  status: fraClaim.status === 'review' ? 'under-review' : fraClaim.status,
  lat: fraClaim.lat,
  lng: fraClaim.lng,
  pattaNumber: fraClaim.pattaNumber,
});

export const convertMapClaimToFRAClaim = (mapClaim: MapClaim): Partial<FRAClaim> => ({
  id: parseInt(mapClaim.id),
  claimantName: mapClaim.claimantName,
  village: mapClaim.village,
  extent: mapClaim.extent,
  status: mapClaim.status === 'under-review' ? 'review' : mapClaim.status === 'rejected' ? 'pending' : mapClaim.status,
  lat: mapClaim.lat,
  lng: mapClaim.lng,
  pattaNumber: mapClaim.pattaNumber,
});

// Other existing interfaces
export interface MatchedIndicator {
  name: string;
  villageValue: number;
  weight: number;
  impact: number;
}

export interface Recommendation {
  scheme: string;
  details: any; // SchemeInfo type would be defined elsewhere
  score: number;
  matchedIndicators: MatchedIndicator[];
  reasoning: string[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  estimatedBeneficiaries: number;
  implementationComplexity: 'Low' | 'Medium';
  isActive: boolean;
}

export interface RAGResult {
  village: any; // Village type would be defined elsewhere
  recommendations: Recommendation[];
  analysisDate: string;
  totalSchemes: number;
  criticalCount: number;
}

export interface ExtractedClaimData {
  claimantName: string;
  fatherName: string;
  village: string;
  pattaNumber: string;
  extent: number | string;
  coordinates: { lat: number | string; lng: number | string };
  surveyNumber: string;
  documents: string[];
  dateOfOccupation: string;
  confidence: { [k: string]: number };
}