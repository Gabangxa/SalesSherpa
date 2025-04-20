import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatDateWithDay } from "@/lib/dateUtils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckInDialog } from "@/components/dialogs/CheckInDialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, CalendarCheck, ScrollText } from "lucide-react";

interface CheckIn {
  id: number;
  userId: number;
  date: string;
  achievements: string;
  challenges: string;
  goals: string;
  reflection: string | null;
}

export default function CheckInsPage() {
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Fetch check-ins
  const { data: checkIns = [], isLoading } = useQuery<CheckIn[]>({
    queryKey: ['/api/check-ins'],
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(checkIns.length / pageSize);
  const paginatedCheckIns = checkIns.slice((page - 1) * pageSize, page * pageSize);
  
  // Handle pagination
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  
  // View check-in details
  const viewCheckInDetails = (checkIn: CheckIn) => {
    setSelectedCheckIn(checkIn);
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Check-ins</h1>
          <p className="text-neutral-600 mt-1">Track your daily progress and reflections</p>
        </div>
        
        <Button 
          onClick={() => setCheckInDialogOpen(true)} 
          className="mt-4 md:mt-0"
        >
          <CalendarCheck className="h-4 w-4 mr-2" />
          New Check-in
        </Button>
      </div>
      
      <Tabs defaultValue="history" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="history">Check-in History</TabsTrigger>
          {selectedCheckIn && (
            <TabsTrigger value="details">Check-in Details</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Check-in History</CardTitle>
              <CardDescription>Review your past check-ins and track your progress over time</CardDescription>
            </CardHeader>
            
            {isLoading ? (
              <CardContent>
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              </CardContent>
            ) : checkIns.length === 0 ? (
              <CardContent className="text-center py-12">
                <ScrollText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Check-ins Yet</h3>
                <p className="text-neutral-500 mb-6">Complete your first check-in to start tracking your progress</p>
                <Button 
                  onClick={() => setCheckInDialogOpen(true)}
                  className="mx-auto"
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Complete Your First Check-in
                </Button>
              </CardContent>
            ) : (
              <>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Achievements</TableHead>
                        <TableHead>Challenges</TableHead>
                        <TableHead>Goals Set</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCheckIns.map((checkIn) => (
                        <TableRow key={checkIn.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatDate(checkIn.date)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{checkIn.achievements}</TableCell>
                          <TableCell className="max-w-xs truncate">{checkIn.challenges}</TableCell>
                          <TableCell className="max-w-xs truncate">{checkIn.goals}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="link" 
                              className="text-primary-600 hover:text-primary-900"
                              onClick={() => viewCheckInDetails(checkIn)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                
                {totalPages > 1 && (
                  <CardFooter className="border-t border-neutral-200 px-6 py-4 flex justify-center">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handlePrevPage} 
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-neutral-700">
                        Page {page} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleNextPage} 
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </>
            )}
          </Card>
        </TabsContent>
        
        {selectedCheckIn && (
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Check-in Details</CardTitle>
                <CardDescription>
                  {formatDateWithDay(selectedCheckIn.date)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Achievements</h3>
                  <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                    <p>{selectedCheckIn.achievements}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Challenges</h3>
                  <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                    <p>{selectedCheckIn.challenges}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Goals Set</h3>
                  <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                    <p>{selectedCheckIn.goals}</p>
                  </div>
                </div>
                
                {selectedCheckIn.reflection && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Additional Reflections</h3>
                    <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                      <p>{selectedCheckIn.reflection}</p>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t border-neutral-200">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCheckIn(null)}
                  className="w-full"
                >
                  Back to Check-in History
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      <CheckInDialog 
        open={checkInDialogOpen} 
        onOpenChange={setCheckInDialogOpen} 
      />
    </div>
  );
}
