'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function ComplianceRadarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        {/* Jaring Laba-laba */}
        <PolarGrid stroke="#52525b" strokeDasharray="3 3" />
        
        {/* Label di ujung jaring */}
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }} 
        />
        
        {/* Angka di tengah (0 - 100) */}
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]} 
          tick={{ fill: '#52525b', fontSize: 10 }} 
        />
        
        {/* Tooltip saat dihover */}
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#09090b', // zinc-950
            borderColor: '#27272a', // zinc-800
            borderRadius: '8px', 
            color: '#fff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
          }}
          itemStyle={{ color: '#10b981', fontWeight: 'bold' }} // Emerald
        />
        
        {/* Area Radar */}
        <Radar 
          name="Compliance Score" 
          dataKey="A" 
          stroke="#10b981" 
          strokeWidth={3}
          fill="#10b981" 
          fillOpacity={0.25} 
          dot={{ r: 4, fill: "#10b981", strokeWidth: 2 }} // Titik tebal di sudut
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}