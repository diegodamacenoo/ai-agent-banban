import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';

const colorPalettes = {
  alabaster: [
    { name: 'Alabaster 25', cssVar: '--color-alabaster-25', description: 'Tom 25 da paleta Alabaster.' },
    { name: 'Alabaster 50', cssVar: '--color-alabaster-50', description: 'Tom 50 da paleta Alabaster.' },
    { name: 'Alabaster 100', cssVar: '--color-alabaster-100', description: 'Tom 100 da paleta Alabaster.' },
    { name: 'Alabaster 200', cssVar: '--color-alabaster-200', description: 'Tom 200 da paleta Alabaster.' },
    { name: 'Alabaster 300', cssVar: '--color-alabaster-300', description: 'Tom 300 da paleta Alabaster.' },
    { name: 'Alabaster 400', cssVar: '--color-alabaster-400', description: 'Tom 400 da paleta Alabaster.' },
    { name: 'Alabaster 500', cssVar: '--color-alabaster-500', description: 'Tom 500 da paleta Alabaster.' },
    { name: 'Alabaster 600', cssVar: '--color-alabaster-600', description: 'Tom 600 da paleta Alabaster.' },
    { name: 'Alabaster 700', cssVar: '--color-alabaster-700', description: 'Tom 700 da paleta Alabaster.' },
    { name: 'Alabaster 800', cssVar: '--color-alabaster-800', description: 'Tom 800 da paleta Alabaster.' },
    { name: 'Alabaster 900', cssVar: '--color-alabaster-900', description: 'Tom 900 da paleta Alabaster.' },
    { name: 'Alabaster 950', cssVar: '--color-alabaster-950', description: 'Tom 950 da paleta Alabaster.' },
  ],
  blue: [
    { name: 'Blue 50', cssVar: '--color-blue-50', description: 'Tom 50 da paleta Blue.' },
    { name: 'Blue 100', cssVar: '--color-blue-100', description: 'Tom 100 da paleta Blue.' },
    { name: 'Blue 200', cssVar: '--color-blue-200', description: 'Tom 200 da paleta Blue.' },
    { name: 'Blue 300', cssVar: '--color-blue-300', description: 'Tom 300 da paleta Blue.' },
    { name: 'Blue 400', cssVar: '--color-blue-400', description: 'Tom 400 da paleta Blue.' },
    { name: 'Blue 500', cssVar: '--color-blue-500', description: 'Tom 500 da paleta Blue.' },
    { name: 'Blue 600', cssVar: '--color-blue-600', description: 'Tom 600 da paleta Blue.' },
    { name: 'Blue 700', cssVar: '--color-blue-700', description: 'Tom 700 da paleta Blue.' },
    { name: 'Blue 800', cssVar: '--color-blue-800', description: 'Tom 800 da paleta Blue.' },
    { name: 'Blue 900', cssVar: '--color-blue-900', description: 'Tom 900 da paleta Blue.' },
    { name: 'Blue 950', cssVar: '--color-blue-950', description: 'Tom 950 da paleta Blue.' },
  ],
  red: [
    { name: 'Red 50', cssVar: '--color-red-50', description: 'Tom 50 da paleta Red.' },
    { name: 'Red 100', cssVar: '--color-red-100', description: 'Tom 100 da paleta Red.' },
    { name: 'Red 200', cssVar: '--color-red-200', description: 'Tom 200 da paleta Red.' },
    { name: 'Red 300', cssVar: '--color-red-300', description: 'Tom 300 da paleta Red.' },
    { name: 'Red 400', cssVar: '--color-red-400', description: 'Tom 400 da paleta Red.' },
    { name: 'Red 500', cssVar: '--color-red-500', description: 'Tom 500 da paleta Red.' },
    { name: 'Red 600', cssVar: '--color-red-600', description: 'Tom 600 da paleta Red.' },
    { name: 'Red 700', cssVar: '--color-red-700', description: 'Tom 700 da paleta Red.' },
    { name: 'Red 800', cssVar: '--color-red-800', description: 'Tom 800 da paleta Red.' },
    { name: 'Red 900', cssVar: '--color-red-900', description: 'Tom 900 da paleta Red.' },
    { name: 'Red 950', cssVar: '--color-red-950', description: 'Tom 950 da paleta Red.' },
  ],
  yellow: [
    { name: 'Yellow 50', cssVar: '--color-yellow-50', description: 'Tom 50 da paleta Yellow.' },
    { name: 'Yellow 100', cssVar: '--color-yellow-100', description: 'Tom 100 da paleta Yellow.' },
    { name: 'Yellow 200', cssVar: '--color-yellow-200', description: 'Tom 200 da paleta Yellow.' },
    { name: 'Yellow 300', cssVar: '--color-yellow-300', description: 'Tom 300 da paleta Yellow.' },
    { name: 'Yellow 400', cssVar: '--color-yellow-400', description: 'Tom 400 da paleta Yellow.' },
    { name: 'Yellow 500', cssVar: '--color-yellow-500', description: 'Tom 500 da paleta Yellow.' },
    { name: 'Yellow 600', cssVar: '--color-yellow-600', description: 'Tom 600 da paleta Yellow.' },
    { name: 'Yellow 700', cssVar: '--color-yellow-700', description: 'Tom 700 da paleta Yellow.' },
    { name: 'Yellow 800', cssVar: '--color-yellow-800', description: 'Tom 800 da paleta Yellow.' },
    { name: 'Yellow 900', cssVar: '--color-yellow-900', description: 'Tom 900 da paleta Yellow.' },
    { name: 'Yellow 950', cssVar: '--color-yellow-950', description: 'Tom 950 da paleta Yellow.' },
  ],
  green: [
    { name: 'Green 50', cssVar: '--color-green-50', description: 'Tom 50 da paleta Green.' },
    { name: 'Green 100', cssVar: '--color-green-100', description: 'Tom 100 da paleta Green.' },
    { name: 'Green 200', cssVar: '--color-green-200', description: 'Tom 200 da paleta Green.' },
    { name: 'Green 300', cssVar: '--color-green-300', description: 'Tom 300 da paleta Green.' },
    { name: 'Green 400', cssVar: '--color-green-400', description: 'Tom 400 da paleta Green.' },
    { name: 'Green 500', cssVar: '--color-green-500', description: 'Tom 500 da paleta Green.' },
    { name: 'Green 600', cssVar: '--color-green-600', description: 'Tom 600 da paleta Green.' },
    { name: 'Green 700', cssVar: '--color-green-700', description: 'Tom 700 da paleta Green.' },
    { name: 'Green 800', cssVar: '--color-green-800', description: 'Tom 800 da paleta Green.' },
    { name: 'Green 900', cssVar: '--color-green-900', description: 'Tom 900 da paleta Green.' },
    { name: 'Green 950', cssVar: '--color-green-950', description: 'Tom 950 da paleta Green.' },
  ],
};

export function ColorsSection() {
  return (
    <Card className="space-y-6">
      {Object.entries(colorPalettes).map(([paletteName, colors]) => (
        <Card key={paletteName} className="p-0">
          <CardHeader>
            <CardTitle className="capitalize">Paleta {paletteName}</CardTitle>
            <CardDescription>
              Tons disponíveis da paleta {paletteName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-2">
              {colors.map((color) => (
                <div key={color.name} className="group cursor-pointer">
                  <div 
                    style={{ backgroundColor: `hsl(var(${color.cssVar}))` }} 
                    className="h-16 w-full rounded-md border shadow-sm transition-transform group-hover:scale-105" 
                    title={`${color.name} - var(${color.cssVar})`}
                  />
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-900">
                      {color.name.split(' ')[1]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {color.cssVar}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </Card>
  );
}