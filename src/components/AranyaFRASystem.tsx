"use client"
import React, { useState } from 'react';
import { MapPin, FileText, CheckCircle, Clock, AlertCircle, AlertTriangle, XCircle, Upload, Search, Filter, ChevronRight, Layers, TrendingUp, Droplets, Cloud, Users, Brain, Target, Zap, Database, ChevronDown, Info, Award } from 'lucide-react';
import { FRAClaim, MapClaim, ForestArea, convertFRAClaimToMapClaim } from '../types';

// Import components dynamically to avoid SSR issues with map
import dynamic from 'next/dynamic';
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">Loading map...</div>
});
import AreaInfoPanel from './AreaInfoPanel';
import DashboardCharts from './DashboardCharts';

// ------------------ Types ------------------
interface SchemeIndicators { [key: string]: number; }
interface SchemeInfo {
  fullName: string;
  description: string;
  eligibility: string[];
  benefits: string[];
  focusAreas: string[];
  budget: string;
  indicators: SchemeIndicators;
}
interface VillageIndicators {
  [key: string]: number | undefined;
  unemployment?: number; poverty?: number; waterScarcity?: number; irrigation?: number; forestDependency?: number; infrastructure?: number; landDegradation?: number; agriculturalLand?: number; cropYield?: number; womenEmpowerment?: number; skillGap?: number; deforestation?: number; biodiversity?: number; tribalPopulation?: number; forestCover?: number; landlessness?: number; homelessness?: number; sanitation?: number;
}
interface Village {
  id: number; name: string; population: number; tribalPopulation: number; forestCover: number; indicators: VillageIndicators; existingSchemes: string[]; avgIncome: number; landlessness: number;
}
// Using FRAClaim from types file
interface MatchedIndicator { name: string; villageValue: number; weight: number; impact: number; }
interface Recommendation {
  scheme: string; details: SchemeInfo; score: number; matchedIndicators: MatchedIndicator[]; reasoning: string[]; priority: 'Critical' | 'High' | 'Medium' | 'Low'; estimatedBeneficiaries: number; implementationComplexity: 'Low' | 'Medium'; isActive: boolean;
}
interface RAGResult { village: Village; recommendations: Recommendation[]; analysisDate: string; totalSchemes: number; criticalCount: number; }
interface ExtractedClaimData {
  claimantName: string; fatherName: string; village: string; pattaNumber: string; extent: number | string; coordinates: { lat: number | string; lng: number | string }; surveyNumber: string; documents: string[]; dateOfOccupation: string; confidence: { [k: string]: number };
}

const AranyaFRASystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dss' | 'claims' | 'map'>('dashboard');
  const [selectedClaim, setSelectedClaim] = useState<FRAClaim | null>(null);
  const [selectedArea, setSelectedArea] = useState<ForestArea | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'review' | 'approved'>('all');
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [ragResults, setRagResults] = useState<RAGResult | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedClaimData | null>(null);

  // RAG Knowledge Base - Scheme Information
  const schemeKnowledgeBase = {
    'MGNREGA': {
      fullName: 'Mahatma Gandhi National Rural Employment Guarantee Act',
      description: 'Provides guaranteed wage employment for 100 days per year to rural households',
      eligibility: ['Rural households', 'Adult members willing to do unskilled manual work', 'At least 18 years of age'],
      benefits: ['100 days guaranteed employment', 'Minimum wages', 'Unemployment allowance'],
      focusAreas: ['Water conservation', 'Drought proofing', 'Land development', 'Rural connectivity'],
      budget: '₹73,000 crores (2023-24)',
      indicators: {
        unemployment: 0.8,
        poverty: 0.9,
        waterScarcity: 0.7,
        landDegradation: 0.6
      }
    },
    'PMKSY': {
      fullName: 'Pradhan Mantri Krishi Sinchayee Yojana',
      description: 'Aims to improve water use efficiency and expand cultivable area under assured irrigation',
      eligibility: ['All farmers', 'Water user associations', 'Panchayats', 'Self-help groups'],
      benefits: ['Drip irrigation subsidy', 'Sprinkler system support', 'Watershed development'],
      focusAreas: ['Water conservation', 'Precision irrigation', 'Watershed management'],
      budget: '₹11,000 crores (2023-24)',
      indicators: {
        waterScarcity: 0.95,
        agriculturalLand: 0.85,
        irrigation: 0.9,
        cropYield: 0.7
      }
    },
    'NRLM': {
      fullName: 'National Rural Livelihood Mission',
      description: 'Aims to reduce poverty by enabling poor households to access gainful self-employment',
      eligibility: ['Poor rural households', 'Women self-help groups', 'Rural youth', 'Tribal communities'],
      benefits: ['Skill training', 'Financial assistance', 'Market linkages', 'Capacity building'],
      focusAreas: ['Livelihood generation', 'Skill development', 'Women empowerment'],
      budget: '₹13,335 crores (2023-24)',
      indicators: {
        poverty: 0.9,
        unemployment: 0.85,
        womenEmpowerment: 0.8,
        skillGap: 0.75
      }
    },
    'CAMPA': {
      fullName: 'Compensatory Afforestation Fund Management and Planning Authority',
      description: 'Manages funds for compensatory afforestation and environmental conservation',
      eligibility: ['Forest departments', 'Gram sabhas', 'Joint forest management committees'],
      benefits: ['Afforestation funding', 'Forest conservation', 'Biodiversity protection'],
      focusAreas: ['Afforestation', 'Forest conservation', 'Wildlife protection'],
      budget: '₹6,000 crores (2023-24)',
      indicators: {
        forestCover: 0.95,
        deforestation: 0.9,
        biodiversity: 0.85,
        tribalPopulation: 0.8
      }
    },
    'FRA': {
      fullName: 'Forest Rights Act',
      description: 'Recognizes and vests forest rights and occupation in forest land to forest dwelling tribes',
      eligibility: ['Forest dwelling Scheduled Tribes', 'Traditional forest dwellers'],
      benefits: ['Individual forest rights', 'Community forest rights', 'Livelihood rights'],
      focusAreas: ['Land rights recognition', 'Forest governance', 'Tribal empowerment'],
      budget: 'State-level implementation',
      indicators: {
        tribalPopulation: 0.95,
        forestDependency: 0.9,
        landlessness: 0.85,
        forestCover: 0.7
      }
    },
    'PMAY-G': {
      fullName: 'Pradhan Mantri Awas Yojana - Gramin',
      description: 'Provides financial assistance for construction of pucca houses',
      eligibility: ['Houseless families', 'Families living in kutcha houses', 'Priority to SC/ST'],
      benefits: ['₹1.2 lakh plain area', '₹1.3 lakh hilly areas', 'Technical support'],
      focusAreas: ['Rural housing', 'Sanitation', 'Infrastructure', 'Poverty alleviation'],
      budget: '₹28,000 crores (2023-24)',
      indicators: {
        homelessness: 0.9,
        poverty: 0.8,
        infrastructure: 0.75,
        sanitation: 0.7
      }
    }
  };

  // Village-level data
  const villageData = [
    {
      id: 1,
      name: 'Kakraban',
      population: 2340,
      tribalPopulation: 78,
      forestCover: 65,
      indicators: {
        unemployment: 42,
        poverty: 56,
        waterScarcity: 68,
        irrigation: 25,
        forestDependency: 72,
        infrastructure: 35
      },
      existingSchemes: ['MGNREGA', 'FRA'],
      avgIncome: 45000,
      landlessness: 45
    },
    {
      id: 2,
      name: 'Ambassa',
      population: 3120,
      tribalPopulation: 65,
      forestCover: 58,
      indicators: {
        unemployment: 38,
        poverty: 48,
        waterScarcity: 72,
        irrigation: 18,
        forestDependency: 68,
        infrastructure: 42
      },
      existingSchemes: ['MGNREGA', 'PMAY-G'],
      avgIncome: 52000,
      landlessness: 38
    },
    {
      id: 3,
      name: 'Kanchanpur',
      population: 1890,
      tribalPopulation: 82,
      forestCover: 71,
      indicators: {
        unemployment: 48,
        poverty: 62,
        waterScarcity: 58,
        irrigation: 22,
        forestDependency: 85,
        infrastructure: 28
      },
      existingSchemes: ['FRA'],
      avgIncome: 38000,
      landlessness: 52
    },
    {
      id: 4,
      name: 'Melaghar',
      population: 2750,
      tribalPopulation: 55,
      forestCover: 48,
      indicators: {
        unemployment: 35,
        poverty: 42,
        waterScarcity: 65,
        irrigation: 32,
        forestDependency: 52,
        infrastructure: 48
      },
      existingSchemes: ['MGNREGA', 'NRLM'],
      avgIncome: 58000,
      landlessness: 32
    },
    {
      id: 5,
      name: 'Udaipur',
      population: 4200,
      tribalPopulation: 88,
      forestCover: 75,
      indicators: {
        unemployment: 52,
        poverty: 68,
        waterScarcity: 75,
        irrigation: 15,
        forestDependency: 92,
        infrastructure: 32
      },
      existingSchemes: ['FRA', 'CAMPA'],
      avgIncome: 35000,
      landlessness: 58
    }
  ];

  // AI-powered RAG function
  const analyzeVillageAndRecommend = (village: Village) => {
    setAnalyzing(true);

    setTimeout(() => {
      const recommendations: Recommendation[] = [];

      Object.entries(schemeKnowledgeBase).forEach(([schemeCode, scheme]: [string, SchemeInfo]) => {
        let score = 0;
        let matchedIndicators: MatchedIndicator[] = [];
        let reasoning: string[] = [];

        Object.entries(scheme.indicators).forEach(([indicator, weight]) => {
          const villageIndicatorValue = village.indicators[indicator];
          if (villageIndicatorValue !== undefined) {
            const matchScore = (villageIndicatorValue / 100) * weight * 100;
            score += matchScore;

            if (matchScore > 40) {
              matchedIndicators.push({
                name: indicator,
                villageValue: villageIndicatorValue,
                weight: weight,
                impact: matchScore
              });
            }
          }
        });

        const normalizedScore = Math.min(100, (score / Object.keys(scheme.indicators).length));

        if (normalizedScore > 60) {
          const topIndicators = matchedIndicators
            .sort((a, b) => b.impact - a.impact)
            .slice(0, 3);

          topIndicators.forEach(ind => {
            reasoning.push(`High ${ind.name} (${ind.villageValue}%) aligns with scheme focus`);
          });

          if (!village.existingSchemes.includes(schemeCode)) {
            reasoning.push('Not currently implemented - high potential for impact');
          } else {
            reasoning.push('Already active - consider expansion or optimization');
          }

          if (schemeCode === 'FRA' && village.tribalPopulation > 70) {
            reasoning.push(`High tribal population (${village.tribalPopulation}%) makes this highly relevant`);
          }
        }

        recommendations.push({
          scheme: schemeCode,
          details: scheme,
          score: Math.round(normalizedScore),
          matchedIndicators,
          reasoning,
          priority: normalizedScore > 75 ? 'Critical' : normalizedScore > 60 ? 'High' : normalizedScore > 45 ? 'Medium' : 'Low',
          estimatedBeneficiaries: Math.round((village.population * normalizedScore) / 200),
          implementationComplexity: normalizedScore > 70 ? 'Medium' : 'Low',
          isActive: village.existingSchemes.includes(schemeCode)
        });
      });

      recommendations.sort((a, b) => b.score - a.score);

      setRagResults({
        village: village,
        recommendations: recommendations.slice(0, 5),
        analysisDate: new Date().toLocaleDateString(),
        totalSchemes: recommendations.length,
        criticalCount: recommendations.filter(r => r.priority === 'Critical').length
      });

      setAnalyzing(false);
    }, 1500);
  };

  // Claims data
  const claimsData: FRAClaim[] = [
    {
      id: 1,
      claimantName: 'Rahul Singh',
      pattaNumber: 'IFR-Tri-Khowai-2025-0017',
      extent: 509,
      village: 'Kakraban',
      status: 'pending',
      confidence: 100,
      lat: 23.45,
      lng: 78.92,
      documents: ['Form A', 'ID Proof', 'Map'],
      aiValidation: { nameMatch: 100, locationMatch: 98, extentMatch: 100 }
    },
    {
      id: 2,
      claimantName: 'Priya Devi',
      pattaNumber: 'IFR-Tri-Khowai-2025-0018',
      extent: 324,
      village: 'Ambassa',
      status: 'approved',
      confidence: 95,
      lat: 23.48,
      lng: 78.88,
      documents: ['Form A', 'ID Proof', 'Map'],
      aiValidation: { nameMatch: 95, locationMatch: 92, extentMatch: 98 }
    },
    {
      id: 3,
      claimantName: 'Amit Kumar',
      pattaNumber: 'IFR-Tri-Khowai-2025-0019',
      extent: 412,
      village: 'Kanchanpur',
      status: 'pending',
      confidence: 88,
      lat: 23.42,
      lng: 78.95,
      documents: ['Form A', 'Map'],
      aiValidation: { nameMatch: 88, locationMatch: 85, extentMatch: 90 }
    },
    {
      id: 4,
      claimantName: 'Sunita Sharma',
      pattaNumber: 'IFR-Tri-Khowai-2025-0020',
      extent: 267,
      village: 'Melaghar',
      status: 'review',
      confidence: 76,
      lat: 23.40,
      lng: 78.90,
      documents: ['Form A'],
      aiValidation: { nameMatch: 76, locationMatch: 80, extentMatch: 72 }
    },
    {
      id: 5,
      claimantName: 'Mohan Lal',
      pattaNumber: 'IFR-Tri-Khowai-2025-0021',
      extent: 589,
      village: 'Udaipur',
      status: 'pending',
      confidence: 92,
      lat: 23.47,
      lng: 78.85,
      documents: ['Form A', 'ID Proof', 'Map', 'Witness Statement'],
      aiValidation: { nameMatch: 92, locationMatch: 95, extentMatch: 88 }
    }
  ];

  const stats = {
    totalClaims: claimsData.length,
    pending: claimsData.filter(c => c.status === 'pending').length,
    approved: claimsData.filter(c => c.status === 'approved').length,
    review: claimsData.filter(c => c.status === 'review').length,
    totalHectares: claimsData.reduce((sum, c) => sum + c.extent, 0),
    avgConfidence: Math.round(claimsData.reduce((sum, c) => sum + c.confidence, 0) / claimsData.length)
  };

  const filteredClaims = filterStatus === 'all'
    ? claimsData
    : claimsData.filter(c => c.status === filterStatus);

  const getStatusColor = (status: FRAClaim['status']) => {
    switch (status) {
      case 'approved': return 'gov-badge success';
      case 'pending': return 'gov-badge warning';
      case 'review': return 'gov-badge info';
      default: return 'gov-badge';
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'Critical': return 'gov-badge danger';
      case 'High': return 'gov-badge warning';
      case 'Medium': return 'gov-badge info';
      case 'Low': return 'gov-badge';
      default: return 'gov-badge';
    }
  };

  const getStatusIcon = (status: FRAClaim['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'review': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleApproveClaim = (claimId: number) => {
    alert(`Claim ${claimId} approved successfully!`);
    setSelectedClaim(null);
  };

  const handleRejectClaim = (claimId: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      alert(`Claim ${claimId} rejected. Reason: ${reason}`);
      setSelectedClaim(null);
    }
  };

  const handleRequestMoreInfo = (claimId: number) => {
    alert(`Additional information requested for Claim ${claimId}`);
  };

  // OCR and NER Processing Function
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    setUploadedFile(file);
    setOcrProcessing(true);

    // Simulate OCR processing (In production, use Tesseract.js or backend API)
    setTimeout(async () => {
      // Simulated OCR text extraction
      const ocrText = `
        FORM A - CLAIM FOR RIGHTS TO FOREST LAND
        
        Name of Claimant: Rajesh Kumar Singh
        Father's Name: Ram Prasad Singh
        Village: Kakraban
        Gram Sabha: Kakraban Panchayat
        Tehsil: Khowai
        District: Tripura
        
        Patta Number: IFR-Tri-Khowai-2025-0022
        
        Nature of Right: Individual Forest Right
        Extent of Land: 3.5 hectares
        Location: Survey No. 245/2, Kakraban Forest
        Coordinates: 23.4567° N, 78.9234° E
        
        Date of Occupation: Before December 2005
        Purpose: Cultivation and Minor Forest Produce Collection
        
        Supporting Documents:
        - Ration Card Number: TRP/KKB/2015/456789
        - Voter ID: TRP1234567
        - Land Revenue Records
        - Witness Statements
        
        Date of Application: 15th September 2025
        Signature: [Signature]
      `;

      // Simulated NER (Named Entity Recognition)
      // In production, use spaCy, BERT-NER, or cloud APIs like Google NLP, AWS Comprehend
      const nerExtraction = performNER(ocrText);

      setExtractedData(nerExtraction);
      setOcrProcessing(false);
    }, 3000); // Simulate 3 second processing time
  };

  // Simple NER function (rule-based for demonstration)
  // In production, replace with ML model like BERT-NER or spaCy
  const performNER = (text: string): ExtractedClaimData => {
    const extracted: ExtractedClaimData = {
      claimantName: '',
      fatherName: '',
      village: '',
      pattaNumber: '',
      extent: 0,
      coordinates: { lat: 0, lng: 0 },
      surveyNumber: '',
      documents: [],
      dateOfOccupation: '',
      confidence: {}
    };

    // Name extraction
    const nameMatch = text.match(/Name of Claimant:\s*([^\n]+)/i);
    if (nameMatch) {
      extracted.claimantName = nameMatch[1].trim();
      extracted.confidence.name = 95;
    }

    // Father's name
    const fatherMatch = text.match(/Father's Name:\s*([^\n]+)/i);
    if (fatherMatch) {
      extracted.fatherName = fatherMatch[1].trim();
      extracted.confidence.fatherName = 92;
    }

    // Village
    const villageMatch = text.match(/Village:\s*([^\n]+)/i);
    if (villageMatch) {
      extracted.village = villageMatch[1].trim();
      extracted.confidence.village = 98;
    }

    // Patta Number
    const pattaMatch = text.match(/Patta Number:\s*([^\n]+)/i);
    if (pattaMatch) {
      extracted.pattaNumber = pattaMatch[1].trim();
      extracted.confidence.pattaNumber = 100;
    }

    // Extent
    const extentMatch = text.match(/Extent of Land:\s*([\d.]+)\s*hectares?/i);
    if (extentMatch) {
      extracted.extent = parseFloat(extentMatch[1]);
      extracted.confidence.extent = 97;
    }

    // Coordinates
    const coordMatch = text.match(/Coordinates:\s*([\d.]+)°\s*N,\s*([\d.]+)°\s*E/i);
    if (coordMatch) {
      extracted.coordinates.lat = parseFloat(coordMatch[1]);
      extracted.coordinates.lng = parseFloat(coordMatch[2]);
      extracted.confidence.coordinates = 94;
    }

    // Survey Number
    const surveyMatch = text.match(/Survey No[.:]\s*([^\n,]+)/i);
    if (surveyMatch) {
      extracted.surveyNumber = surveyMatch[1].trim();
      extracted.confidence.surveyNumber = 90;
    }

    // Documents
    if (text.includes('Ration Card')) extracted.documents.push('Ration Card');
    if (text.includes('Voter ID')) extracted.documents.push('Voter ID');
    if (text.includes('Land Revenue')) extracted.documents.push('Land Revenue Records');
    if (text.includes('Witness')) extracted.documents.push('Witness Statements');

    // Date of occupation
    const dateMatch = text.match(/Date of Occupation:\s*([^\n]+)/i);
    if (dateMatch) {
      extracted.dateOfOccupation = dateMatch[1].trim();
      extracted.confidence.dateOfOccupation = 88;
    }

    return extracted;
  };

  const saveExtractedClaim = () => {
    if (!extractedData) return;

    alert(`Claim saved successfully!\n\nClaimant: ${extractedData.claimantName}\nVillage: ${extractedData.village}\nExtent: ${extractedData.extent} hectares`);

    setUploadModalOpen(false);
    setUploadedFile(null);
    setExtractedData(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="gov-header shadow-md">
        <div className="gov-container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/90 rounded-md p-2 shadow-sm">
              <Layers className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="gov-header-title text-xl md:text-2xl font-semibold tracking-tight">Aranya FRA Atlas</h1>
              <p className="text-xs md:text-[0.7rem] font-medium opacity-90 tracking-wide">Forest Rights Monitoring & Scheme DSS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="gov-badge info hidden sm:inline-flex">AI ENABLED</span>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="gov-btn outline text-sm"
            >
              <Upload className="w-4 h-4" /> Upload Claim
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="gov-subnav">
        <div className="gov-container flex overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'dss', label: 'AI Decision Support', icon: Brain },
            { id: 'claims', label: 'Claims', icon: FileText },
            { id: 'map', label: 'Map', icon: MapPin }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'dashboard' | 'dss' | 'claims' | 'map')}
              className={`gov-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="w-4 h-4 opacity-70" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main id="main" className="gov-container py-8">
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              <div className="gov-card accent-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] tracking-wide uppercase font-semibold" style={{ color: 'var(--color-text-muted)' }}>Total Claims</p>
                    <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>{stats.totalClaims}</p>
                  </div>
                  <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                    <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                </div>
              </div>
              <div className="gov-card accent-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] tracking-wide uppercase font-semibold" style={{ color: 'var(--color-text-muted)' }}>Pending Review</p>
                    <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--color-warning)' }}>{stats.pending}</p>
                  </div>
                  <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                    <Clock className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                  </div>
                </div>
              </div>
              <div className="gov-card accent-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] tracking-wide uppercase font-semibold" style={{ color: 'var(--color-text-muted)' }}>Villages Analyzed</p>
                    <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--color-success)' }}>{villageData.length}</p>
                  </div>
                  <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                    <Target className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  </div>
                </div>
              </div>
              <div className="gov-card accent-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] tracking-wide uppercase font-semibold" style={{ color: 'var(--color-text-muted)' }}>AI Confidence</p>
                    <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>{stats.avgConfidence}%</p>
                  </div>
                  <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                    <Brain className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Quick Access to DSS */}
            <section className="gov-card flex flex-col md:flex-row items-center justify-between gap-6" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>AI Decision Support System</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Analyzing {Object.keys(schemeKnowledgeBase).length} registered schemes via indicator matching</p>
                <button
                  onClick={() => setActiveTab('dss')}
                  className="gov-btn"
                >
                  <Brain className="w-4 h-4" /> Launch Analysis <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="hidden md:block pr-4">
                <Database className="w-24 h-24 opacity-15" style={{ color: 'var(--color-primary)' }} />
              </div>
            </section>

            <div className="gov-card overflow-hidden">
              <div className="pb-4 mb-4 border-b border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <h2 className="gov-section-title">Claims Distribution Overview</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Approved ({claimsData.filter(c => c.status === 'approved').length})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Pending ({claimsData.filter(c => c.status === 'pending').length})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Review ({claimsData.filter(c => c.status === 'review').length})</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Regional Map Visualization */}
                <div className="md:col-span-2">
                  <div className="relative h-80 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="w-full h-full bg-green-100 opacity-50"></div>
                    </div>
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                      Tripura Forest Region
                    </div>
                    <div className="relative w-full h-full">
                      {claimsData.map((claim, idx) => (
                        <div
                          key={claim.id}
                          className="absolute group cursor-pointer"
                          style={{
                            left: `${15 + idx * 16}%`,
                            top: `${25 + (idx % 3) * 25}%`
                          }}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform hover:scale-125 transition-all duration-200 ${claim.status === 'approved' ? 'bg-green-500 hover:bg-green-600' :
                              claim.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                'bg-orange-500 hover:bg-orange-600'
                            }`}>
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            style={{ backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                            <div className="text-sm font-bold">{claim.village}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {claim.claimantName}
                            </div>
                            <div className="text-xs font-semibold mt-1">
                              {claim.extent} acres • {claim.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Claims Summary Stats */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-success-border)' }}>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-success-light)' }}>
                        <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{claimsData.filter(c => c.status === 'approved').length}</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Approved Claims</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-warning-border)' }}>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-warning-light)' }}>
                        <Clock className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>{claimsData.filter(c => c.status === 'pending').length}</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Pending Review</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-info-border)' }}>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-info-light)' }}>
                        <Target className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-info)' }}>{claimsData.reduce((sum, c) => sum + c.extent, 0).toLocaleString()}</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Acres</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-primary-border)' }}>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                        <Users className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{claimsData.length}</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Active Villages</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Dashboard Charts */}
            <DashboardCharts claims={claimsData.map(convertFRAClaimToMapClaim)} />
          </div>
        )}

        {/* AI Decision Support System */}
        {activeTab === 'dss' && (
          <div className="space-y-6">
            <div className="gov-card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                      <Brain className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>AI-Powered Decision Support System</h2>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)' }}>RAG-based analysis of {Object.keys(schemeKnowledgeBase).length} government schemes</p>
                </div>
                <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success)' }}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-success)' }}></div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>AI Online</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="gov-card">
                <div className="flex items-center space-x-3 mb-3">
                  <Database className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Knowledge Base</h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{Object.keys(schemeKnowledgeBase).length}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Schemes indexed</p>
              </div>

              <div className="gov-card">
                <div className="flex items-center space-x-3 mb-3">
                  <Target className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Coverage</h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-success)' }}>{villageData.length}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Villages analyzed</p>
              </div>

              <div className="gov-card">
                <div className="flex items-center space-x-3 mb-3">
                  <Zap className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                  <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Cost Efficiency</h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-warning)' }}>95%</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Reduced analysis time</p>
              </div>
            </div>

            <div className="gov-card">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Select Village for AI Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {villageData.map(village => (
                  <button
                    key={village.id}
                    onClick={() => {
                      setSelectedVillage(village);
                      analyzeVillageAndRecommend(village);
                    }}
                    className="p-4 border-2 rounded-lg transition text-left gov-focus"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{village.name}</h4>
                      <Users className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <div className="space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <p>Population: {village.population.toLocaleString()}</p>
                      <p>Tribal: {village.tribalPopulation}%</p>
                      <p>Forest Cover: {village.forestCover}%</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {village.existingSchemes.map(scheme => (
                        <span key={scheme} className="gov-badge info text-xs">
                          {scheme}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {analyzing && (
              <div className="p-12 rounded-xl border-2" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 flex items-center justify-center space-x-2" style={{ color: 'var(--color-text-primary)' }}>
                    <span>AI Analysis in Progress</span>
                    <div className="px-2 py-1 rounded-full text-xs font-semibold animate-pulse" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                      PROCESSING
                    </div>
                  </h3>
                  <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    Processing village data and matching with scheme indicators...
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-success)' }}></div>
                      <span>Analyzing Indicators</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-warning)', animationDelay: '0.5s' }}></div>
                      <span>Matching Schemes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-info)', animationDelay: '1s' }}></div>
                      <span>Generating Report</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {ragResults && !analyzing && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Analysis Complete: {ragResults.village.name}</h3>
                      <p className="text-green-100">Generated {ragResults.recommendations.length} AI-powered recommendations</p>
                    </div>
                    <Award className="w-16 h-16 opacity-20" />
                  </div>
                </div>

                {ragResults.recommendations.map((rec, idx) => (
                  <div key={idx} className="gov-card overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: rec.priority === 'Critical' ? 'var(--color-danger)' : rec.priority === 'High' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    <div className="bg-gradient-to-r p-6 border-b" style={{ background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-alt) 100%)', borderBottomColor: 'var(--color-border)' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg" style={{ backgroundColor: rec.priority === 'Critical' ? 'var(--color-danger)' : rec.priority === 'High' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                              #{idx + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{rec.scheme}</h3>
                              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{rec.details.fullName}</p>
                            </div>
                          </div>
                          <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{rec.details.description}</p>
                        </div>
                        <div className="ml-8 text-right flex flex-col items-end space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Match Score</div>
                              <div className="text-4xl font-bold" style={{ color: rec.score >= 70 ? 'var(--color-success)' : rec.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>{rec.score}%</div>
                            </div>
                            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${rec.score >= 70 ? 'var(--color-success)' : rec.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'}20` }}>
                              <div className="w-12 h-12 rounded-full border-4 flex items-center justify-center" style={{ borderColor: rec.score >= 70 ? 'var(--color-success)' : rec.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                                <Award className="w-6 h-6" style={{ color: rec.score >= 70 ? 'var(--color-success)' : rec.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                              </div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getPriorityColor(rec.priority)}`}>
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: rec.priority === 'Critical' ? 'var(--color-danger)' : rec.priority === 'High' ? 'var(--color-warning)' : 'var(--color-success)' }}></div>
                            {rec.priority} Priority
                          </span>
                          {rec.isActive && (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-text)', border: '1px solid var(--color-success-border)' }}>
                              <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: 'var(--color-success)' }}></div>
                              Currently Active
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-xl border-2 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-success)' }}>
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Estimated Beneficiaries</p>
                          </div>
                          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-success)' }}>{rec.estimatedBeneficiaries.toLocaleString()}</p>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>people will benefit</p>
                        </div>
                        <div className="p-6 rounded-xl border-2 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-info)' }}>
                              <Target className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Implementation</p>
                          </div>
                          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-info)' }}>{rec.implementationComplexity}</p>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>complexity level</p>
                        </div>
                        <div className="p-6 rounded-xl border-2 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
                              <Database className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Budget Allocation</p>
                          </div>
                          <p className="text-2xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>{rec.details.budget}</p>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>total allocation</p>
                        </div>
                      </div>

                      <div className="p-6 rounded-xl border-2" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                        <h4 className="font-bold text-lg mb-4 flex items-center space-x-3" style={{ color: 'var(--color-text-primary)' }}>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
                            <Brain className="w-5 h-5 text-white" />
                          </div>
                          <span>AI Reasoning & Analysis</span>
                        </h4>
                        <div className="space-y-3">
                          {rec.reasoning.map((reason, ridx) => (
                            <div key={ridx} className="flex items-start space-x-3 p-3 rounded-lg transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                              <div className="p-1 rounded-full mt-1" style={{ backgroundColor: 'var(--color-success)' }}>
                                <ChevronRight className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {rec.matchedIndicators.length > 0 && (
                        <div className="p-6 rounded-xl border-2" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          <h4 className="font-bold text-lg mb-4 flex items-center space-x-3" style={{ color: 'var(--color-text-primary)' }}>
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-warning)' }}>
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span>Key Indicators Match</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {rec.matchedIndicators.slice(0, 3).map((ind, iidx) => (
                              <div key={iidx} className="p-4 rounded-lg border-2 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text-primary)' }}>
                                    {ind.name.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                  <span className="text-lg font-bold px-2 py-1 rounded-full text-xs" style={{
                                    backgroundColor: ind.villageValue >= 70 ? 'var(--color-success-light)' : ind.villageValue >= 50 ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                                    color: ind.villageValue >= 70 ? 'var(--color-success)' : ind.villageValue >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
                                  }}>
                                    {ind.villageValue}%
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                                  <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${ind.villageValue}%`,
                                      background: `linear-gradient(90deg, ${ind.villageValue >= 70 ? 'var(--color-success)' : ind.villageValue >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'}, ${ind.villageValue >= 70 ? 'var(--color-success)' : ind.villageValue >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'}90)`
                                    }}
                                  />
                                </div>
                                <div className="text-xs font-medium mt-2" style={{ color: 'var(--color-text-muted)' }}>
                                  Impact Weight: {ind.weight}x
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="p-6 rounded-xl border-2" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          <h4 className="font-bold text-lg mb-4 flex items-center space-x-3" style={{ color: 'var(--color-text-primary)' }}>
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-success)' }}>
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <span>Key Benefits</span>
                          </h4>
                          <ul className="space-y-3">
                            {rec.details.benefits.map((benefit, bidx) => (
                              <li key={bidx} className="flex items-start space-x-3 p-3 rounded-lg transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                                <div className="p-1 rounded-full mt-1" style={{ backgroundColor: 'var(--color-success)' }}>
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm leading-relaxed font-medium" style={{ color: 'var(--color-text-primary)' }}>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-6 rounded-xl border-2" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          <h4 className="font-bold text-lg mb-4 flex items-center space-x-3" style={{ color: 'var(--color-text-primary)' }}>
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-info)' }}>
                              <Target className="w-5 h-5 text-white" />
                            </div>
                            <span>Focus Areas</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {rec.details.focusAreas.map((area, aidx) => (
                              <div key={aidx} className="flex items-center space-x-3 px-4 py-3 rounded-lg border-2 transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-info)' }}></div>
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{area}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t-2 flex items-center justify-between" style={{ borderTopColor: 'var(--color-border)' }}>
                        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          Recommendation #{idx + 1} • Generated {new Date().toLocaleDateString()}
                        </div>
                        <div className="flex items-center space-x-4">
                          <button className="gov-btn-secondary flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                          <button className="gov-btn flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>Generate Plan</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-8 rounded-xl border-2 transition-all hover:shadow-lg" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-info)' }}>
                      <Info className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl mb-3 flex items-center space-x-2" style={{ color: 'var(--color-text-primary)' }}>
                        <span>Cost-Effective RAG Implementation</span>
                        <div className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
                          AI-Powered
                        </div>
                      </h4>
                      <p className="text-base mb-4 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                        This system uses Retrieval-Augmented Generation (RAG) to match village-level socio-economic
                        indicators with government scheme criteria stored in our knowledge base. This approach delivers:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start space-x-3 p-4 rounded-lg transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                          <div className="p-1 rounded-full mt-1" style={{ backgroundColor: 'var(--color-success)' }}>
                            <Database className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Cost-effective:</span>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>No expensive LLM API calls - uses local vector matching</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-4 rounded-lg transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                          <div className="p-1 rounded-full mt-1" style={{ backgroundColor: 'var(--color-warning)' }}>
                            <Zap className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Fast:</span>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Instant recommendations without external API latency</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-4 rounded-lg transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                          <div className="p-1 rounded-full mt-1" style={{ backgroundColor: 'var(--color-info)' }}>
                            <Brain className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Transparent:</span>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Clear reasoning based on indicator matching</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-4 rounded-lg transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                          <div className="p-1 rounded-full mt-1" style={{ backgroundColor: 'var(--color-primary)' }}>
                            <TrendingUp className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Scalable:</span>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Easily expandable knowledge base with new schemes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Claims List View */}
        {activeTab === 'claims' && (
          <div className="space-y-6">
            <div className="gov-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search claims..."
                      className="pl-10 pr-4 py-2 rounded-lg gov-focus"
                      style={{
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'review' | 'approved')}
                    className="px-4 py-2 rounded-lg gov-focus"
                    style={{
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="review">Under Review</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <button className="gov-btn outline">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </button>
              </div>
            </div>

            <div className="gov-card overflow-hidden">
              <table className="w-full gov-table">
                <thead style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>Claimant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>Patta Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>Village</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>Extent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>AI Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredClaims.map(claim => (
                    <tr key={claim.id} className="transition hover:opacity-90"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="px-6 py-4">
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{claim.claimantName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{claim.pattaNumber}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{claim.village}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{claim.extent} ha</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${claim.confidence >= 90 ? 'bg-green-500' :
                                  claim.confidence >= 75 ? 'bg-yellow-500' :
                                    'bg-orange-500'
                                }`}
                              style={{ width: `${claim.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{claim.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center space-x-1 w-fit ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          <span className="capitalize">{claim.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="font-medium text-sm flex items-center space-x-1 transition hover:opacity-80"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <span>Review</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Map View */}
        {activeTab === 'map' && (
          <div className="gov-card overflow-hidden">
            <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Interactive Claims Map</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Explore forest areas and FRA claims with real GIS functionality</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-3 py-1 rounded text-xs" style={{ backgroundColor: 'var(--color-info-light)', color: 'var(--color-info-text)' }}>
                    <Layers className="w-3 h-3" />
                    <span>Satellite + Forest Layers</span>
                  </div>
                  <div className="flex items-center space-x-1 px-3 py-1 rounded text-xs" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-text)' }}>
                    <MapPin className="w-3 h-3" />
                    <span>{claimsData.length} Claims</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-[600px]">
              <MapComponent
                claims={claimsData.map(convertFRAClaimToMapClaim)}
                selectedClaim={selectedClaim ? convertFRAClaimToMapClaim(selectedClaim) : null}
                onClaimSelect={(mapClaim) => {
                  const fraClaim = claimsData.find(c => c.id.toString() === mapClaim.id);
                  setSelectedClaim(fraClaim || null);
                }}
                onAreaSelect={setSelectedArea}
                center={[23.8315, 91.2868]} // Tripura coordinates
                zoom={10}
              />
              <AreaInfoPanel
                selectedArea={selectedArea}
                onClose={() => setSelectedArea(null)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Claim Review Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-6 border-b text-white gov-header">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Claim Review</h2>
                  <p className="mt-1" style={{ color: 'var(--color-primary-light)' }}>{selectedClaim.pattaNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Users className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  <span>Claimant Information</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border-2 transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Name</p>
                    <p className="font-bold mt-1 text-lg" style={{ color: 'var(--color-text-primary)' }}>{selectedClaim.claimantName}</p>
                  </div>
                  <div className="p-4 rounded-lg border-2 transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Village</p>
                    <p className="font-bold mt-1 text-lg" style={{ color: 'var(--color-text-primary)' }}>{selectedClaim.village}</p>
                  </div>
                  <div className="p-4 rounded-lg border-2 transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Extent</p>
                    <p className="font-bold mt-1 text-lg" style={{ color: 'var(--color-text-primary)' }}>{selectedClaim.extent} hectares</p>
                  </div>
                  <div className="p-4 rounded-lg border-2 transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Status</p>
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold mt-2 ${getStatusColor(selectedClaim.status)}`}>
                      {getStatusIcon(selectedClaim.status)}
                      <span className="capitalize">{selectedClaim.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Brain className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  <span>AI Validation Results</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(selectedClaim.aiValidation).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-lg border-2 transition-all hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text-primary)' }}>{key.replace(/([A-Z])/g, ' $1').trim()} Match</p>
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold`} style={{ color: value >= 90 ? 'var(--color-success)' : value >= 75 ? 'var(--color-warning)' : 'var(--color-danger)' }}>{value}%</span>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: value >= 90 ? 'var(--color-success-light)' : value >= 75 ? 'var(--color-warning-light)' : 'var(--color-danger-light)' }}>
                            {value >= 90 ? <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} /> :
                              value >= 75 ? <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} /> :
                                <AlertCircle className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />}
                          </div>
                        </div>
                      </div>
                      <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${value}%`,
                            background: `linear-gradient(90deg, ${value >= 90 ? 'var(--color-success)' : value >= 75 ? 'var(--color-warning)' : 'var(--color-danger)'}, ${value >= 90 ? 'var(--color-success)' : value >= 75 ? 'var(--color-warning)' : 'var(--color-danger)'}90)`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2" style={{ color: 'var(--color-text-primary)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  <span>Submitted Documents</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedClaim.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:shadow-sm transition-all" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-info-light)' }}>
                        <FileText className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2" style={{ color: 'var(--color-text-primary)' }}>
                  <MapPin className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  <span>Geolocation</span>
                </h3>
                <div className="p-6 rounded-xl border-2 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center space-x-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                      <MapPin className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Coordinates:</span>
                        <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{selectedClaim.lat}°N, {selectedClaim.lng}°E</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }}></div>
                        <span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedClaim.village} Village</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                        GPS Verified
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t-2" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={() => handleRequestMoreInfo(selectedClaim.id)}
                  className="flex items-center space-x-2 px-6 py-3 border-2 rounded-xl transition-all font-semibold hover:scale-105 hover:shadow-md"
                  style={{
                    borderColor: 'var(--color-warning)',
                    color: 'var(--color-warning)',
                    backgroundColor: 'var(--color-surface)'
                  }}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Request More Info</span>
                </button>
                <button
                  onClick={() => handleRejectClaim(selectedClaim.id)}
                  className="flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-all font-semibold hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: 'var(--color-danger)' }}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Claim</span>
                </button>
                <button
                  onClick={() => handleApproveClaim(selectedClaim.id)}
                  className="flex items-center space-x-2 px-8 py-3 text-white rounded-xl transition-all font-semibold hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: 'var(--color-success)' }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve Claim</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Claim Modal with OCR & NER */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-6 gov-header">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Upload & Process Claim Document</h2>
                  <p className="mt-1 opacity-90 text-white text-sm">AI-powered OCR + NER for automatic data extraction</p>
                </div>
                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadedFile(null);
                    setExtractedData(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {!uploadedFile && (
                <div className="border-2 border-dashed rounded-xl p-12 text-center transition cursor-pointer"
                  style={{ borderColor: 'var(--color-border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Upload Claim Document</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                      Supported formats: JPG, PNG, PDF (Form A, Land Records, etc.)
                    </p>
                    <div className="gov-btn">
                      Choose File
                    </div>
                  </label>
                </div>
              )}

              {ocrProcessing && (
                <div className="rounded-xl p-12 text-center border-2"
                  style={{ backgroundColor: 'var(--color-surface-muted)', borderColor: 'var(--color-primary)' }}>
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>AI Processing Document</h3>
                  <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <p className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                      <span>Step 1: OCR Text Extraction - In Progress...</span>
                    </p>
                    <p className="flex items-center justify-center space-x-2" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock className="w-4 h-4" />
                      <span>Step 2: Named Entity Recognition (NER) - Waiting...</span>
                    </p>
                    <p className="flex items-center justify-center space-x-2" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock className="w-4 h-4" />
                      <span>Step 3: Data Validation - Waiting...</span>
                    </p>
                  </div>
                </div>
              )}

              {extractedData && !ocrProcessing && (
                <div className="space-y-6">
                  <div className="border-2 rounded-xl p-6" style={{ backgroundColor: 'var(--color-success-light)', borderColor: 'var(--color-success)' }}>
                    <div className="flex items-center space-x-3 mb-3">
                      <CheckCircle className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
                      <h3 className="text-lg font-bold" style={{ color: 'var(--color-success)' }}>Data Extraction Complete!</h3>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-success)' }}>
                      AI has successfully extracted and validated the following information. Please review and confirm.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Claimant Name</p>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-success)' }}>
                          {extractedData.confidence.name}% confidence
                        </span>
                      </div>
                      <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{extractedData.claimantName}</p>
                      <div className="w-full rounded-full h-1 mt-2" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${extractedData.confidence.name}%`,
                            backgroundColor: 'var(--color-success)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="border-2 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Father's Name</p>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-success)' }}>
                          {extractedData.confidence.fatherName}% confidence
                        </span>
                      </div>
                      <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{extractedData.fatherName}</p>
                      <div className="w-full rounded-full h-1 mt-2" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${extractedData.confidence.fatherName}%`,
                            backgroundColor: 'var(--color-success)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="border-2 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Village</p>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-success)' }}>
                          {extractedData.confidence.village}% confidence
                        </span>
                      </div>
                      <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{extractedData.village}</p>
                      <div className="w-full rounded-full h-1 mt-2" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${extractedData.confidence.village}%`,
                            backgroundColor: 'var(--color-success)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="border-2 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Patta Number</p>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-success)' }}>
                          {extractedData.confidence.pattaNumber}% confidence
                        </span>
                      </div>
                      <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{extractedData.pattaNumber}</p>
                      <div className="w-full rounded-full h-1 mt-2" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${extractedData.confidence.pattaNumber}%`,
                            backgroundColor: 'var(--color-success)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="border-2 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Extent (Hectares)</p>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-success)' }}>
                          {extractedData.confidence.extent}% confidence
                        </span>
                      </div>
                      <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{extractedData.extent} ha</p>
                      <div className="w-full rounded-full h-1 mt-2" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${extractedData.confidence.extent}%`,
                            backgroundColor: 'var(--color-success)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="border-2 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Coordinates</p>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-success)' }}>
                          {extractedData.confidence.coordinates}% confidence
                        </span>
                      </div>
                      <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                        {extractedData.coordinates.lat}°N, {extractedData.coordinates.lng}°E
                      </p>
                      <div className="w-full rounded-full h-1 mt-2" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${extractedData.confidence.coordinates}%`,
                            backgroundColor: 'var(--color-success)'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-2 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>Extracted Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.documents.map((doc, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1" style={{ backgroundColor: 'var(--color-info-light)', color: 'var(--color-info-text)' }}>
                          <FileText className="w-3 h-3" />
                          <span>{doc}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-2 rounded-xl p-4" style={{ backgroundColor: 'var(--color-info-light)', borderColor: 'var(--color-info-border)' }}>
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
                      <div className="text-sm" style={{ color: 'var(--color-info-text)' }}>
                        <p className="font-bold mb-1">OCR + NER Technology Stack:</p>
                        <ul className="space-y-1 text-xs">
                          <li><strong>OCR Engine:</strong> Tesseract.js / Google Vision API / AWS Textract</li>
                          <li><strong>NER Model:</strong> spaCy, BERT-NER, or Custom trained models</li>
                          <li><strong>Cost:</strong> ~₹0.10 per document (using AWS Textract) or Free (Tesseract.js)</li>
                          <li><strong>Accuracy:</strong> 85-95% depending on document quality</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setExtractedData(null);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Upload Another
                    </button>
                    <button
                      onClick={saveExtractedClaim}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Save Claim Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AranyaFRASystem;