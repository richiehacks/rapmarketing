import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRealData } from '@/hooks/useRealData';
import { 
  Users, 
  Mail, 
  Video, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Database,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

export function RealTimeMetrics() {
  const { metrics, loading } = useRealData();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalROI = metrics.linkedin.acceptanceRate + metrics.email.openRate + metrics.webinar.rsvpRate;

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LinkedIn Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.linkedin.totalSent}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="flex items-center">
                {metrics.linkedin.acceptanceRate > 20 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {metrics.linkedin.acceptanceRate.toFixed(1)}% acceptance rate
              </span>
            </div>
            <Progress value={metrics.linkedin.acceptanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.email.totalSent}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="flex items-center">
                {metrics.email.openRate > 25 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {metrics.email.openRate.toFixed(1)}% open rate
              </span>
            </div>
            <Progress value={metrics.email.openRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webinar Invites</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.webinar.totalInvited}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="flex items-center">
                {metrics.webinar.rsvpRate > 15 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {metrics.webinar.rsvpRate.toFixed(1)}% RSVP rate
              </span>
            </div>
            <Progress value={metrics.webinar.rsvpRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalROI.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">
              Combined performance score
            </div>
            <Progress value={Math.min(totalROI, 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span>LinkedIn Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Accepted</div>
                <div className="font-semibold text-green-600">{metrics.linkedin.accepted}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pending</div>
                <div className="font-semibold text-yellow-600">{metrics.linkedin.pending}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Declined</div>
                <div className="font-semibold text-red-600">{metrics.linkedin.declined}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Companies</div>
                <div className="font-semibold">{metrics.linkedin.companies.length}</div>
              </div>
            </div>
            {metrics.linkedin.companies.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Top Companies</div>
                <div className="flex flex-wrap gap-1">
                  {metrics.linkedin.companies.slice(0, 3).map((company, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-green-500" />
              <span>Email Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Opened</div>
                <div className="font-semibold text-blue-600">{metrics.email.opened}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Replied</div>
                <div className="font-semibold text-green-600">{metrics.email.replied}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Open Rate</div>
                <div className="font-semibold">{metrics.email.openRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Reply Rate</div>
                <div className="font-semibold">{metrics.email.replyRate.toFixed(1)}%</div>
              </div>
            </div>
            {metrics.email.campaigns.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Active Campaigns</div>
                <div className="flex flex-wrap gap-1">
                  {metrics.email.campaigns.slice(0, 2).map((campaign, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {campaign}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-purple-500" />
              <span>Webinar Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Confirmed</div>
                <div className="font-semibold text-green-600">{metrics.webinar.confirmed}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pending</div>
                <div className="font-semibold text-yellow-600">{metrics.webinar.pending}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Declined</div>
                <div className="font-semibold text-red-600">{metrics.webinar.declined}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Industries</div>
                <div className="font-semibold">{metrics.webinar.industries.length}</div>
              </div>
            </div>
            {metrics.webinar.industries.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Top Industries</div>
                <div className="flex flex-wrap gap-1">
                  {metrics.webinar.industries.slice(0, 3).map((industry, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Recent Datasets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.datasets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No datasets uploaded yet</p>
              <p className="text-sm">Upload your first Excel file to see real data here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.datasets.slice(0, 5).map((dataset) => (
                <div key={dataset.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{dataset.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dataset.row_count} rows • {new Date(dataset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {dataset.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}