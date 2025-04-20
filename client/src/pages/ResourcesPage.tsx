import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BookOpen,
  FileText,
  Video,
  BookMarked,
  Search,
  Download,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ResourcesPage() {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Resources</h1>
          <p className="text-neutral-600 mt-1">Sales strategies, fintech insights, and professional development</p>
        </div>
        
        <div className="mt-4 md:mt-0 w-full md:w-64">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
            <Input placeholder="Search resources..." className="pl-8" />
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="sales" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales Techniques</TabsTrigger>
          <TabsTrigger value="fintech">Fintech Industry</TabsTrigger>
          <TabsTrigger value="mindset">Entrepreneurial Mindset</TabsTrigger>
          <TabsTrigger value="templates">Sales Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ResourceCard 
              title="Building Trust in Fintech Sales"
              description="Learn proven techniques for establishing credibility and trust with fintech prospects"
              type="article"
              tags={["Trust Building", "Credibility"]}
              link="#"
            />
            
            <ResourceCard 
              title="Consultative Selling for Payment Solutions"
              description="A practical guide to consultative selling approaches for payment processing products"
              type="guide"
              tags={["Consultative Selling", "Payments"]}
              link="#"
            />
            
            <ResourceCard 
              title="Handling Technical Objections"
              description="Strategies for addressing complex technical objections from IT stakeholders"
              type="video"
              tags={["Objection Handling", "Technical Sales"]}
              link="#"
            />
            
            <ResourceCard 
              title="Enterprise Fintech Sales Cycle"
              description="Navigate the complexities of enterprise sales cycles in the financial sector"
              type="guide"
              tags={["Enterprise", "Sales Cycle"]}
              link="#"
            />
            
            <ResourceCard 
              title="Competitive Displacement Strategies"
              description="Tactics for replacing incumbent financial technology solutions"
              type="article"
              tags={["Competitive", "Displacement"]}
              link="#"
            />
            
            <ResourceCard 
              title="Value-Based Pricing Conversations"
              description="How to shift the conversation from price to value in fintech sales"
              type="video"
              tags={["Pricing", "Value Selling"]}
              link="#"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="fintech">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ResourceCard 
              title="Open Banking Revolution"
              description="How open banking is transforming the financial services landscape"
              type="article"
              tags={["Open Banking", "API"]}
              link="#"
            />
            
            <ResourceCard 
              title="Embedded Finance Market Guide"
              description="Comprehensive overview of embedded finance opportunities and trends"
              type="guide"
              tags={["Embedded Finance", "Market Trends"]}
              link="#"
            />
            
            <ResourceCard 
              title="Blockchain in Financial Services"
              description="Practical applications of blockchain technology in banking and payments"
              type="video"
              tags={["Blockchain", "Innovation"]}
              link="#"
            />
            
            <ResourceCard 
              title="AI and Machine Learning in FinTech"
              description="How artificial intelligence is reshaping risk assessment and fraud detection"
              type="article"
              tags={["AI", "Machine Learning"]}
              link="#"
            />
            
            <ResourceCard 
              title="Regulatory Landscape for FinTech"
              description="Navigating compliance requirements across different financial services"
              type="guide"
              tags={["Regulation", "Compliance"]}
              link="#"
            />
            
            <ResourceCard 
              title="Digital Transformation in Banking"
              description="Case studies of successful digital transformation initiatives in banking"
              type="video"
              tags={["Digital Transformation", "Banking"]}
              link="#"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="mindset">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ResourceCard 
              title="Building Entrepreneurial Resilience"
              description="Mental frameworks for developing resilience in high-pressure sales environments"
              type="guide"
              tags={["Resilience", "Mental Toughness"]}
              link="#"
            />
            
            <ResourceCard 
              title="Growth Mindset for Sales Professionals"
              description="Applying growth mindset principles to overcome sales challenges"
              type="article"
              tags={["Growth Mindset", "Development"]}
              link="#"
            />
            
            <ResourceCard 
              title="Strategic Risk-Taking in Sales"
              description="How calculated risk-taking can accelerate your sales career"
              type="video"
              tags={["Risk Management", "Strategy"]}
              link="#"
            />
            
            <ResourceCard 
              title="Personal Brand Development"
              description="Building your personal brand as a fintech sales professional"
              type="guide"
              tags={["Personal Branding", "Influence"]}
              link="#"
            />
            
            <ResourceCard 
              title="Innovation Mindset in Client Solutions"
              description="Bringing innovative thinking to client problems and solutions"
              type="article"
              tags={["Innovation", "Problem Solving"]}
              link="#"
            />
            
            <ResourceCard 
              title="Time Management for Sales Entrepreneurs"
              description="Productivity systems specifically designed for high-performing sales professionals"
              type="video"
              tags={["Time Management", "Productivity"]}
              link="#"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TemplateCard 
              title="Fintech Solution Proposal Template"
              description="Comprehensive template for structuring compelling fintech solution proposals"
              fileType="DOCX"
              fileSize="285 KB"
            />
            
            <TemplateCard 
              title="Financial ROI Calculator"
              description="Customizable spreadsheet for demonstrating ROI of your fintech solution"
              fileType="XLSX"
              fileSize="420 KB"
            />
            
            <TemplateCard 
              title="Payment Processing Implementation Plan"
              description="Project plan template for payment processing implementation timelines"
              fileType="PPTX"
              fileSize="1.2 MB"
            />
            
            <TemplateCard 
              title="Security Compliance Overview"
              description="Template for addressing security and compliance concerns in fintech sales"
              fileType="PDF"
              fileSize="780 KB"
            />
            
            <TemplateCard 
              title="Case Study Framework"
              description="Structure for creating compelling customer success stories"
              fileType="DOCX"
              fileSize="350 KB"
            />
            
            <TemplateCard 
              title="Competitive Analysis Matrix"
              description="Template for mapping your solution against competitors"
              fileType="XLSX"
              fileSize="520 KB"
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookMarked className="mr-2 h-5 w-5 text-primary-600" />
            Recommended Reading
          </CardTitle>
          <CardDescription>
            Essential books for fintech sales professionals
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-72">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="h-24 w-16 bg-neutral-200 rounded flex-shrink-0 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-neutral-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-medium">The Fintech Revolution: How Financial Technology is Transforming Banking</h3>
                  <p className="text-sm text-neutral-500 mt-1">By Michael Stevens</p>
                  <p className="text-sm text-neutral-600 mt-2">
                    A comprehensive overview of how fintech is disrupting traditional banking
                    models and creating new opportunities for innovation.
                  </p>
                  <div className="mt-2">
                    <Button variant="link" className="h-auto p-0 text-primary-600">
                      View Summary
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-24 w-16 bg-neutral-200 rounded flex-shrink-0 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-neutral-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-medium">Challenger Sale: Taking Control of the Customer Conversation</h3>
                  <p className="text-sm text-neutral-500 mt-1">By Matthew Dixon & Brent Adamson</p>
                  <p className="text-sm text-neutral-600 mt-2">
                    Based on an extensive study of thousands of sales reps, this book challenges
                    conventional sales wisdom and introduces a new approach for complex B2B sales.
                  </p>
                  <div className="mt-2">
                    <Button variant="link" className="h-auto p-0 text-primary-600">
                      View Summary
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-24 w-16 bg-neutral-200 rounded flex-shrink-0 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-neutral-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-medium">Value-Based Selling: The Art of Building High-Trust Client Relationships</h3>
                  <p className="text-sm text-neutral-500 mt-1">By Tom Williams</p>
                  <p className="text-sm text-neutral-600 mt-2">
                    A practical guide for shifting conversations from price to value,
                    especially relevant for complex fintech solutions with significant ROI potential.
                  </p>
                  <div className="mt-2">
                    <Button variant="link" className="h-auto p-0 text-primary-600">
                      View Summary
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-24 w-16 bg-neutral-200 rounded flex-shrink-0 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-neutral-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-medium">The Entrepreneurial Mindset: Strategies for Continuously Creating Opportunity</h3>
                  <p className="text-sm text-neutral-500 mt-1">By Rita Gunther McGrath & Ian MacMillan</p>
                  <p className="text-sm text-neutral-600 mt-2">
                    Explores how to develop an entrepreneurial approach to business challenges,
                    helping sales professionals think more strategically about client solutions.
                  </p>
                  <div className="mt-2">
                    <Button variant="link" className="h-auto p-0 text-primary-600">
                      View Summary
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Resource Card Component
interface ResourceCardProps {
  title: string;
  description: string;
  type: "article" | "guide" | "video";
  tags: string[];
  link: string;
}

function ResourceCard({ title, description, type, tags, link }: ResourceCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case "article":
        return <FileText className="h-5 w-5" />;
      case "guide":
        return <BookOpen className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
  const getTypeLabel = () => {
    switch (type) {
      case "article":
        return "Article";
      case "guide":
        return "Guide";
      case "video":
        return "Video";
      default:
        return "Resource";
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center mb-2">
          <Badge variant="outline" className="bg-neutral-100 text-neutral-800">
            <span className="flex items-center">
              {getTypeIcon()}
              <span className="ml-1">{getTypeLabel()}</span>
            </span>
          </Badge>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-neutral-600">{description}</p>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="bg-primary-50 text-primary-800 hover:bg-primary-100">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-neutral-200 pt-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => window.open(link, "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Resource
        </Button>
      </CardFooter>
    </Card>
  );
}

// Template Card Component
interface TemplateCardProps {
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
}

function TemplateCard({ title, description, fileType, fileSize }: TemplateCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center mb-2">
          <Badge variant="outline" className="bg-neutral-100 text-neutral-800">
            {fileType}
          </Badge>
          <span className="text-xs text-neutral-500 ml-2">{fileSize}</span>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-neutral-600">{description}</p>
      </CardContent>
      
      <CardFooter className="border-t border-neutral-200 pt-4">
        <Button className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </CardFooter>
    </Card>
  );
}
