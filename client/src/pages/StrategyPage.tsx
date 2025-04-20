import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Swords, Lightbulb, Target, Users, Calendar, DollarSign, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StrategyPage() {
  const { toast } = useToast();
  const [planType, setPlanType] = useState("weekly");
  
  const handleSaveStrategy = () => {
    toast({
      title: "Strategy saved",
      description: "Your strategic plan has been saved successfully",
    });
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Strategic Planning</h1>
          <p className="text-neutral-600 mt-1">Develop your entrepreneurial strategy and execution plans</p>
        </div>
      </div>
      
      <Tabs defaultValue="planner" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="planner">Strategy Planner</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="frameworks">Sales Frameworks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="planner">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Swords className="mr-2 h-5 w-5" />
                Strategic Planning Workspace
              </CardTitle>
              <CardDescription>
                Define your goals, strategies, and action steps to achieve your sales targets
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="col-span-3">
                  <Label htmlFor="plan-title">Plan Title</Label>
                  <Input 
                    id="plan-title" 
                    placeholder="e.g., Q2 Fintech Sales Growth Strategy" 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-type">Plan Type</Label>
                  <Select 
                    value={planType} 
                    onValueChange={setPlanType}
                  >
                    <SelectTrigger id="plan-type" className="mt-1">
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly Plan</SelectItem>
                      <SelectItem value="monthly">Monthly Plan</SelectItem>
                      <SelectItem value="quarterly">Quarterly Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Accordion type="single" collapsible defaultValue="goals">
                <AccordionItem value="goals">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center">
                      <Target className="mr-2 h-5 w-5 text-primary-600" />
                      Goals & Objectives
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <p className="text-sm text-neutral-600 mb-2">
                      Define specific, measurable goals you want to achieve within this time period
                    </p>
                    <Textarea 
                      placeholder="List your key goals and objectives here..." 
                      rows={3}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="revenue-target">Revenue Target</Label>
                        <Input 
                          id="revenue-target" 
                          placeholder="e.g., $150,000" 
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accounts-target">New Accounts Target</Label>
                        <Input 
                          id="accounts-target" 
                          placeholder="e.g., 10" 
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="market">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center">
                      <Users className="mr-2 h-5 w-5 text-primary-600" />
                      Market Analysis
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <p className="text-sm text-neutral-600 mb-2">
                      Analyze your target market, competition, and opportunities
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="target-segments">Target Customer Segments</Label>
                        <Textarea 
                          id="target-segments" 
                          placeholder="Describe your ideal customer profiles..." 
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="competitor-analysis">Competitor Analysis</Label>
                        <Textarea 
                          id="competitor-analysis" 
                          placeholder="Identify key competitors and their strengths/weaknesses..." 
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="market-opportunities">Market Opportunities</Label>
                        <Textarea 
                          id="market-opportunities" 
                          placeholder="What opportunities exist in the current market environment?" 
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tactics">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5 text-primary-600" />
                      Tactics & Action Steps
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <p className="text-sm text-neutral-600 mb-2">
                      Define specific actions you'll take to achieve your goals
                    </p>
                    <div className="space-y-4 border border-neutral-200 rounded-md p-4">
                      <div className="flex justify-between">
                        <Label className="text-primary-700 font-semibold">Action Item #1</Label>
                        <Button variant="ghost" size="sm">Add Action</Button>
                      </div>
                      <Input placeholder="Action title" />
                      <Textarea placeholder="Description" rows={2} />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="due-date">Due Date</Label>
                          <Input type="date" id="due-date" className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select defaultValue="medium">
                            <SelectTrigger id="priority" className="mt-1">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select defaultValue="not-started">
                            <SelectTrigger id="status" className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not-started">Not Started</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="metrics">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-primary-600" />
                      Success Metrics
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <p className="text-sm text-neutral-600 mb-2">
                      Define how you'll measure success for your strategic plan
                    </p>
                    <Textarea 
                      placeholder="List the key performance indicators (KPIs) you'll track..." 
                      rows={3}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primary-metric">Primary Success Metric</Label>
                        <Input 
                          id="primary-metric" 
                          placeholder="e.g., Closing 3 enterprise accounts" 
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="review-frequency">Review Frequency</Label>
                        <Select defaultValue="weekly">
                          <SelectTrigger id="review-frequency" className="mt-1">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="reflection">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5 text-primary-600" />
                      Reflection & Learning
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <p className="text-sm text-neutral-600 mb-2">
                      Document your learning and insights as you execute your plan
                    </p>
                    <Textarea 
                      placeholder="What's working well? What needs adjustment? What have you learned?" 
                      rows={5}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            
            <CardFooter className="border-t border-neutral-200 pt-6 flex justify-end space-x-4">
              <Button variant="outline">Save Draft</Button>
              <Button onClick={handleSaveStrategy}>Save Strategy</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary-600" />
                  30-60-90 Day Plan
                </CardTitle>
                <CardDescription>
                  Strategic roadmap for your first 3 months with new accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  This template helps you structure a progressive approach to onboarding new
                  fintech clients, establishing value, and expanding the relationship.
                </p>
                <div className="text-sm text-neutral-600">
                  <p className="font-medium text-neutral-800">Includes:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Initial onboarding milestones</li>
                    <li>Value demonstration strategies</li>
                    <li>Account expansion tactics</li>
                    <li>Success metrics for each phase</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="border-t border-neutral-200 pt-4">
                <Button className="w-full">Use Template</Button>
              </CardFooter>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5 text-primary-600" />
                  Quarterly Sales Strategy
                </CardTitle>
                <CardDescription>
                  Comprehensive quarterly planning template for fintech sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  Align your strategic approach, target accounts, and execution tactics
                  for maximum impact in the upcoming quarter.
                </p>
                <div className="text-sm text-neutral-600">
                  <p className="font-medium text-neutral-800">Includes:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Account prioritization framework</li>
                    <li>Competitive positioning strategies</li>
                    <li>Revenue forecasting methods</li>
                    <li>Resource allocation planning</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="border-t border-neutral-200 pt-4">
                <Button className="w-full">Use Template</Button>
              </CardFooter>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-primary-600" />
                  Enterprise Deal Strategy
                </CardTitle>
                <CardDescription>
                  Strategic approach for closing complex enterprise fintech deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  A structured methodology for navigating and closing high-value,
                  complex fintech deals with multiple stakeholders.
                </p>
                <div className="text-sm text-neutral-600">
                  <p className="font-medium text-neutral-800">Includes:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Stakeholder mapping framework</li>
                    <li>Decision process navigation</li>
                    <li>Value proposition customization</li>
                    <li>Objection handling strategies</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="border-t border-neutral-200 pt-4">
                <Button className="w-full">Use Template</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="frameworks">
          <Card>
            <CardHeader>
              <CardTitle>Sales Frameworks & Methodologies</CardTitle>
              <CardDescription>
                Apply proven sales methodologies tailored for fintech solutions
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="spin">
                  <AccordionTrigger className="font-medium">
                    SPIN Selling for Fintech
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="bg-neutral-50 rounded-md p-4 border border-neutral-200">
                      <p className="text-sm text-neutral-600 mb-4">
                        SPIN Selling is particularly effective for complex fintech sales
                        by focusing on uncovering pain points through strategic questioning.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-primary-700">Situation Questions</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            "What payment systems are you currently using?"
                            "How is your current fraud detection process structured?"
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Problem Questions</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            "Are you experiencing delays in payment processing?"
                            "How much manual reconciliation is your team handling?"
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Implication Questions</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            "How do those delays impact customer satisfaction?"
                            "What's the cost of manual reconciliation in terms of staff hours?"
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Need-Payoff Questions</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            "If you could reduce payment processing time by 80%, what would that mean for your business?"
                            "How valuable would it be to automate 95% of your reconciliation process?"
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="value">
                  <AccordionTrigger className="font-medium">
                    Value-Based Selling Approach
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="bg-neutral-50 rounded-md p-4 border border-neutral-200">
                      <p className="text-sm text-neutral-600 mb-4">
                        This framework focuses on articulating and quantifying the specific
                        business value your fintech solution delivers, moving beyond features
                        to focus on outcomes.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-primary-700">Step 1: Identify Value Drivers</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Determine which aspects of your solution create measurable business value:
                            cost reduction, revenue growth, risk mitigation, or competitive advantage.
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Step 2: Quantify the Value</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Create a value calculator that demonstrates ROI, payback period,
                            and total cost of ownership for your specific fintech solution.
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Step 3: Create Value Hypotheses</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Develop testable value hypotheses for each client, such as:
                            "Our payment solution can reduce processing costs by 30% while improving cash flow visibility."
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Step 4: Co-create Value</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Work with the client to refine and validate the value model,
                            creating stakeholder buy-in through collaborative discovery.
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="challenger">
                  <AccordionTrigger className="font-medium">
                    Challenger Sale for Fintech
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="bg-neutral-50 rounded-md p-4 border border-neutral-200">
                      <p className="text-sm text-neutral-600 mb-4">
                        The Challenger approach helps fintech sales professionals shift client
                        perspectives by introducing disruptive insights about their industry
                        and business challenges.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-primary-700">Step 1: The Warmer</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Establish credibility by demonstrating your understanding of their
                            specific financial services context and challenges.
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Step 2: The Reframe</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Present a unique, compelling insight that challenges their current
                            thinking about payment processing, fraud prevention, or customer acquisition.
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Step 3: Rational Drowning</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Present data and industry benchmarks that quantify the cost of
                            the status quo and amplify the urgency for change.
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Step 4: Emotional Impact</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Connect the business challenges to personal implications for
                            stakeholders (career growth, team success, strategic influence).
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-primary-700">Step 5: A New Way</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Present your fintech solution as the unique answer to the newly
                            framed challenge, with clear differentiation from alternatives.
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
