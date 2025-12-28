import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Heart, Star, BookOpen, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMyEbooks } from '@/hooks/useEbooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCounter from '@/components/StatsCounter';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { GENRE_LABELS } from '@/hooks/useEbooks';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(142, 76%, 36%)',
  'hsl(48, 96%, 53%)',
  'hsl(280, 65%, 60%)',
];

const EbookAnalytics = () => {
  const { user } = useAuth();
  const { ebooks, loading } = useMyEbooks();

  const stats = useMemo(() => {
    if (!ebooks.length) return { totalViews: 0, totalLikes: 0, totalReviews: 0, avgRating: 0 };
    
    const totalViews = ebooks.reduce((sum, e) => sum + (e.views_count || 0), 0);
    const totalLikes = ebooks.reduce((sum, e) => sum + (e.likes_count || 0), 0);
    const totalReviews = ebooks.reduce((sum, e) => sum + (e.reviews_count || 0), 0);
    const avgRating = ebooks.reduce((sum, e) => sum + (e.average_rating || 0), 0) / ebooks.length;
    
    return { totalViews, totalLikes, totalReviews, avgRating };
  }, [ebooks]);

  const ebookChartData = useMemo(() => {
    return ebooks
      .slice(0, 10)
      .map((ebook) => ({
        name: ebook.title.length > 15 ? ebook.title.substring(0, 15) + '...' : ebook.title,
        views: ebook.views_count || 0,
        likes: ebook.likes_count || 0,
        reviews: ebook.reviews_count || 0,
      }));
  }, [ebooks]);

  const genreDistribution = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    ebooks.forEach((ebook) => {
      const genre = ebook.genre || 'other';
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    
    return Object.entries(genreCounts).map(([genre, count]) => ({
      name: GENRE_LABELS[genre as keyof typeof GENRE_LABELS] || genre,
      value: count,
    }));
  }, [ebooks]);

  const monthlyTrends = useMemo(() => {
    const monthData: Record<string, { views: number; likes: number; reviews: number }> = {};
    
    ebooks.forEach((ebook) => {
      const date = new Date(ebook.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthData[monthKey]) {
        monthData[monthKey] = { views: 0, likes: 0, reviews: 0 };
      }
      
      monthData[monthKey].views += ebook.views_count || 0;
      monthData[monthKey].likes += ebook.likes_count || 0;
      monthData[monthKey].reviews += ebook.reviews_count || 0;
    });
    
    return Object.entries(monthData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...data,
      }));
  }, [ebooks]);

  const chartConfig = {
    views: { label: 'Views', color: 'hsl(var(--primary))' },
    likes: { label: 'Likes', color: 'hsl(var(--chart-2))' },
    reviews: { label: 'Reviews', color: 'hsl(var(--chart-3))' },
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view analytics</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/my-ebooks">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My eBooks
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">eBook Analytics</h1>
              <p className="text-muted-foreground">Track performance across your {ebooks.length} eBooks</p>
            </div>
          </div>
        </motion.div>

        {ebooks.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No eBooks yet</h2>
            <p className="text-muted-foreground mb-4">Create your first eBook to start tracking analytics</p>
            <Button asChild>
              <Link to="/ebooks/create">Create eBook</Link>
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total Views</span>
                </div>
                <StatsCounter value={stats.totalViews} label="" />
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Heart className="w-5 h-5 text-destructive" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total Likes</span>
                </div>
                <StatsCounter value={stats.totalLikes} label="" />
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total Reviews</span>
                </div>
                <StatsCounter value={stats.totalReviews} label="" />
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Star className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Avg Rating</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stats.avgRating.toFixed(1)}
                </p>
              </Card>
            </motion.div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Performance by eBook */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance by eBook</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart data={ebookChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100} 
                          className="text-xs"
                          tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="likes" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="reviews" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Genre Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Genre Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genreDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={false}
                          >
                            {genreDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Monthly Trends */}
            {monthlyTrends.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Engagement Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <LineChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="likes" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--chart-2))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="reviews" 
                          stroke="hsl(var(--chart-3))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--chart-3))' }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Top Performing eBooks Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Performing eBooks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Title</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Views</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Likes</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Reviews</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ebooks
                          .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                          .slice(0, 5)
                          .map((ebook) => (
                            <tr key={ebook.id} className="border-b border-border/50 hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <Link 
                                  to={`/ebooks/${ebook.id}`}
                                  className="font-medium hover:text-primary transition-colors"
                                >
                                  {ebook.title}
                                </Link>
                              </td>
                              <td className="text-center py-3 px-4">{ebook.views_count || 0}</td>
                              <td className="text-center py-3 px-4">{ebook.likes_count || 0}</td>
                              <td className="text-center py-3 px-4">{ebook.reviews_count || 0}</td>
                              <td className="text-center py-3 px-4">
                                <span className="flex items-center justify-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  {(ebook.average_rating || 0).toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default EbookAnalytics;
