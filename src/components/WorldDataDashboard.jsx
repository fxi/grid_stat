import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import gridLogo from '@/assets/grid-logo-black-en.svg'
import '@/App.css'

// Metadata service to encapsulate generation logic
class MetadataService {
  static generateMetadataCatalog() {
    const indicators = [
      { id: 'gdp', name: 'GDP', topic: 'Economy', sdgs: ['No Poverty', 'Decent Work and Economic Growth'] },
      { id: 'life_expectancy', name: 'Life Expectancy', topic: 'Health', sdgs: ['Good Health and Well-being'] },
      { id: 'co2_emissions', name: 'CO2 Emissions', topic: 'Environment', sdgs: ['Climate Action', 'Sustainable Cities and Communities'] },
      { id: 'education_index', name: 'Education Index', topic: 'Education', sdgs: ['Quality Education'] },
      { id: 'renewable_energy', name: 'Renewable Energy', topic: 'Energy', sdgs: ['Affordable and Clean Energy', 'Climate Action'] },
      { id: 'poverty_rate', name: 'Poverty Rate', topic: 'Social Development', sdgs: ['No Poverty', 'Reduced Inequalities'] }
    ];

    const countries = [
      { id: 'usa', name: 'United States', region: 'North America' },
      { id: 'chn', name: 'China', region: 'Asia' },
      { id: 'ind', name: 'India', region: 'Asia' },
      { id: 'deu', name: 'Germany', region: 'Europe' },
      { id: 'bra', name: 'Brazil', region: 'South America' },
      { id: 'nga', name: 'Nigeria', region: 'Africa' },
      { id: 'jpn', name: 'Japan', region: 'Asia' },
      { id: 'fra', name: 'France', region: 'Europe' },
      { id: 'gbr', name: 'United Kingdom', region: 'Europe' },
      { id: 'aus', name: 'Australia', region: 'Oceania' }
    ];

    return { indicators, countries };
  }

  static generateMockDatabase(metadataCatalog) {
    const database = {};
    metadataCatalog.indicators.forEach(indicator => {
      database[indicator.id] = {};
      metadataCatalog.countries.forEach(country => {
        database[indicator.id][country.id] = Array.from({ length: 24 }, (_, i) => ({
          year: 2000 + i,
          value: Math.random() * 100
        }));
      });
    });
    return database;
  }
}

const metadataCatalog = MetadataService.generateMetadataCatalog();
const mockDatabase = MetadataService.generateMockDatabase(metadataCatalog);

// Facet filtering logic in a separate function
const applyFilters = (items, searchTerm, facets, facetKey) => {
  const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
  const activeFacets = Object.keys(facets).filter(key => facets[key]);

  return items.filter(item => {
    const matchesSearch = lowerCaseSearchTerm === "" || item.name.toLowerCase().includes(lowerCaseSearchTerm);
    const matchesFacet = activeFacets.length === 0 || activeFacets.includes(item[facetKey]);
    return matchesSearch && matchesFacet;
  });
};

// Specific function for SDGs as they are arrays
const applySDGFilters = (items, facets) => {
  const activeSDGs = Object.keys(facets).filter(key => facets[key]);

  return items.filter(item => {
    const matchesSDG = activeSDGs.length === 0 || item.sdgs.some(sdg => activeSDGs.includes(sdg));
    return matchesSDG;
  });
};

const WorldDataDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [activeTab, setActiveTab] = useState('search');
  const [facets, setFacets] = useState({ topics: {}, sdgs: {}, regions: {} });

  const allTopics = useMemo(() => {
    return [...new Set(metadataCatalog.indicators.map(i => i.topic))];
  }, []);

  const allSDGs = useMemo(() => {
    return [...new Set(metadataCatalog.indicators.flatMap(i => i.sdgs))];
  }, []);

  const allRegions = useMemo(() => {
    return [...new Set(metadataCatalog.countries.map(c => c.region))];
  }, []);

  const toggleFacet = (category, item) => {
    setFacets(prevFacets => ({
      ...prevFacets,
      [category]: {
        ...prevFacets[category],
        [item]: !prevFacets[category][item]
      }
    }));
  };

  const filteredIndicators = useMemo(() => {
    let indicators = applyFilters(
      metadataCatalog.indicators,
      searchTerm,
      facets.topics,
      'topic'
    );

    indicators = applySDGFilters(indicators, facets.sdgs);

    return indicators;
  }, [searchTerm, facets]);

  const filteredCountries = useMemo(() => {
    return applyFilters(
      metadataCatalog.countries,
      searchTerm,
      facets.regions,
      'region'
    );
  }, [searchTerm, facets]);

  const handleIndicatorSelect = indicator => {
    setSelectedIndicator(indicator);
    setSelectedCountries([]);
    setActiveTab('details');
  };

  const handleCountryToggle = country => {
    setSelectedCountries(prev => (
      prev.includes(country.id)
        ? prev.filter(id => id !== country.id)
        : [...prev, country.id]
    ));
  };

  const chartData = useMemo(() => {
    if (!selectedIndicator || selectedCountries.length === 0) {
      return [];
    }

    const data = mockDatabase[selectedIndicator.id];
    const years = Array.from({ length: 24 }, (_, i) => 2000 + i);

    return years.map(year => {
      const yearData = { year };
      selectedCountries.forEach(countryId => {
        const country = metadataCatalog.countries.find(c => c.id === countryId);
        const yearValue = data[countryId].find(d => d.year === year);
        yearData[country.name] = yearValue?.value ?? null;
      });
      return yearData;
    });
  }, [selectedIndicator, selectedCountries]);

  return (
    <div className="p-4 max-w-7xl mx-auto">
<h1 className="text-3xl font-bold mb-4">UNEPGRID stat explorer</h1>
  
    <span className="text-red-500 text-sm">mockup data demo</span>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="details">Indicator</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search indicators or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="col-span-1 space-y-4">
            {/* Sidebar Facets */}
            <div className="col-span-1 space-y-4">
              <FacetFilter
                title="Topics"
                items={allTopics}
                selectedItems={facets.topics}
                onToggle={item => toggleFacet('topics', item)}
              />
              <FacetFilter
                title="SDGs"
                items={allSDGs}
                selectedItems={facets.sdgs}
                onToggle={item => toggleFacet('sdgs', item)}
              />
              <FacetFilter
                title="Regions"
                items={allRegions}
                selectedItems={facets.regions}
                onToggle={item => toggleFacet('regions', item)}
              />
            </div>

            {/* Search Results */}
            <div className="col-span-1 md:col-span-3">
              <SearchResults
                title="Indicators"
                items={filteredIndicators}
                onItemClick={handleIndicatorSelect}
                description={indicator => `Topic: ${indicator.topic}, SDGs: ${indicator.sdgs.join(', ')}`}
              />
              <SearchResults
                title="Countries"
                items={filteredCountries}
                onItemClick={() => {}}
                description={country => `Region: ${country.region}`}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details">
          {selectedIndicator ? (
            <>
              <h2 className="text-2xl font-semibold mb-4">{selectedIndicator.name}</h2>
              <CountrySelection
                countries={metadataCatalog.countries}
                selectedCountries={selectedCountries}
                onToggleCountry={handleCountryToggle}
              />
              <ChartDisplay
                title={`${selectedIndicator.name} Over Time`}
                chartData={chartData}
                selectedCountries={selectedCountries}
              />
            </>
          ) : (
            <NoIndicatorSelected onBackToSearch={() => setActiveTab('search')} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component for facet filters
const FacetFilter = ({ title, items, selectedItems, onToggle }) => (
  <details className="bg-gray-100 p-2 rounded">
    <summary className="font-semibold cursor-pointer">{title}</summary>
    <div className="mt-2 space-y-1">
      {items.map(item => (
        <label key={item} className="flex items-center space-x-2">
          <Checkbox
            checked={selectedItems[item] || false}
            onCheckedChange={() => onToggle(item)}
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  </details>
);

// Component for search results
const SearchResults = ({ title, items, onItemClick, description }) => (
  <>
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <ul className="space-y-2 max-h-96 overflow-y-auto">
      {items.map((item) => (
        <li key={item.id} className="bg-white p-2 rounded shadow">
          <Button variant="link" onClick={() => onItemClick(item)}>
            {item.name}
          </Button>
          <p className="text-sm text-gray-600">{description(item)}</p>
        </li>
      ))}
    </ul>
  </>
);

// Component for country selection
const CountrySelection = ({ countries, selectedCountries, onToggleCountry }) => (
  <div className="mb-4">
    <h3 className="text-xl font-semibold mb-2">Select Countries:</h3>
    <div className="flex flex-wrap gap-2">
      {countries.map(country => (
        <Button
          key={country.id}
          variant={selectedCountries.includes(country.id) ? "secondary" : "outline"}
          onClick={() => onToggleCountry(country)}
        >
          {country.name}
        </Button>
      ))}
    </div>
  </div>
);

// Component for displaying the chart
const ChartDisplay = ({ title, chartData, selectedCountries }) => (
  <Card className="mb-4">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {chartData.length > 0 && selectedCountries.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedCountries.map((countryId, index) => {
              const country = metadataCatalog.countries.find(c => c.id === countryId);
              return country ? (
                <Line
                  key={countryId}
                  type="monotone"
                  dataKey={country.name}
                  stroke={`hsl(${index * 30}, 70%, 50%)`}
                  connectNulls
                />
              ) : null;
            })}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p>Please select at least one country to display data.</p>
      )}
    </CardContent>
  </Card>
);

// Component for when no indicator is selected
const NoIndicatorSelected = ({ onBackToSearch }) => (
  <div className="text-center py-8">
    <h2 className="text-2xl font-semibold mb-4">No Indicator Selected</h2>
    <p>Please select an indicator from the Search tab to view details.</p>
    <Button className="mt-4" onClick={onBackToSearch}>
      Go to Search
    </Button>
  </div>
);

export default WorldDataDashboard;
