import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatDate } from "@/lib/dateUtils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CheckIn {
  id: number;
  date: string;
  achievements: string;
  challenges: string;
  goals: string;
}

export default function RecentCheckIns() {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  
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
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4">
        <CardTitle>Recent Check-ins</CardTitle>
      </CardHeader>
      
      {isLoading ? (
        <CardContent className="p-0">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table className="border-collapse w-full">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="py-2 px-3">Date</TableHead>
                  <TableHead className="py-2 px-3">Achievements</TableHead>
                  <TableHead className="py-2 px-3">Challenges</TableHead>
                  <TableHead className="py-2 px-3">Goals Set</TableHead>
                  <TableHead className="py-2 px-3 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCheckIns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-4 text-muted-foreground">
                      No check-ins recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCheckIns.map((checkIn) => (
                    <TableRow key={checkIn.id} className="border-b border-border">
                      <TableCell className="font-medium whitespace-nowrap py-2 px-3">
                        {formatDate(checkIn.date)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate py-2 px-3">{checkIn.achievements}</TableCell>
                      <TableCell className="max-w-xs truncate py-2 px-3">{checkIn.challenges}</TableCell>
                      <TableCell className="max-w-xs truncate py-2 px-3">{checkIn.goals}</TableCell>
                      <TableCell className="text-right py-2 px-3">
                        <Button variant="link" className="p-1 h-auto text-primary hover:text-primary/90">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
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
  );
}
