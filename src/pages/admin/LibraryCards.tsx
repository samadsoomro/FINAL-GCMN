import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Download, CreditCard, RefreshCw, Search, CheckCircle, FileSpreadsheet } from "lucide-react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import collegeLogo from "@/assets/images/college-logo.png";

const getQRCodeUrl = (text: string, size: number = 100) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};

interface LibraryCardApplication {
  id: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  dob: string | null;
  class: string;
  field: string | null;
  rollNo: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  status: string;
  cardNumber: string;
  studentId: string | null;
  issueDate: string | null;
  validThrough: string | null;
  createdAt: string;
}

const getFieldCode = (field: string): string => {
  const fieldCodeMap: Record<string, string> = {
    "Computer Science": "CS",
    "Commerce": "COM",
    "Humanities": "HM",
    "Pre-Engineering": "PE",
    "Pre-Medical": "PM"
  };
  return fieldCodeMap[field] || "XX";
};

const LibraryCards = () => {
  const [applications, setApplications] = useState<LibraryCardApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/library-card-applications', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data || []);
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiRequest('PATCH', `/api/library-card-applications/${id}/status`, { status });
      if (res.ok) {
        const updatedApp = await res.json();
        setApplications(prev => prev.map(app => app.id === id ? updatedApp : app));

        if (status === 'approved') {
          toast({
            title: "Library Card Approved Successfully",
            description: `The library card for ${updatedApp.firstName} ${updatedApp.lastName} is now active.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Status Updated",
            description: `Application status changed to ${status}.`,
          });
        }
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      await apiRequest('DELETE', `/api/library-card-applications/${id}`, {});
      setApplications(applications.filter(app => app.id !== id));
      toast({
        title: "Deleted",
        description: "Application has been deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting application:", error);
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
    }
  };

  const generatePDF = async (app: LibraryCardApplication) => {
    const doc = new jsPDF("p", "mm", "a4");

    const qrDestination = `https://gcmn-library.replit.dev/library-card/${app.cardNumber}`;
    const qrCodeUrl = getQRCodeUrl(qrDestination, 100);

    // Fetch QR Code
    const response = await fetch(qrCodeUrl);
    const blob = await response.blob();
    const qrCodeDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    // Load Logo
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = collegeLogo;
    await new Promise((resolve) => {
      logoImg.onload = resolve;
    });

    // Draw Logo to Canvas to get Data URL (standardize format)
    const canvas = document.createElement('canvas');
    canvas.width = logoImg.width;
    canvas.height = logoImg.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(logoImg, 0, 0);
    const logoDataUrl = canvas.toDataURL('image/jpeg', 0.8);

    // --- CONSTANTS ---
    const pageW = 210;
    const margin = 15;
    const boxW = 180;
    const boxH = 120; // Approx half page
    const topY = 15;  // Top box start Y
    const botY = 150; // Bottom box start Y
    const greenColor: [number, number, number] = [22, 78, 59];
    const whiteColor: [number, number, number] = [255, 255, 255];
    const cornerRadius = 3;

    // ==========================================
    // TOP HALF - FRONT SIDE
    // ==========================================

    // Border (Curved)
    doc.setDrawColor(...greenColor);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, topY, boxW, boxH, cornerRadius, cornerRadius, "S");

    // Header Background (Green Strip - Curved top corners)
    doc.setFillColor(...greenColor);
    // Draw rounded rect for the full header height
    doc.roundedRect(margin, topY, boxW, 28, cornerRadius, cornerRadius, "F");
    // Draw straight rect for bottom half of header to square off bottom corners
    doc.rect(margin, topY + 14, boxW, 14, "F");

    // Logo
    doc.addImage(logoDataUrl, "JPEG", margin + 5, topY + 2, 24, 24);

    // Header Text (White on Green)
    doc.setTextColor(...whiteColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Government of Sindh", pageW / 2, topY + 8, { align: "center" });
    doc.text("College Education Department", pageW / 2, topY + 12, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("GOVT COLLEGE FOR MEN NAZIMABAD", pageW / 2, topY + 19, { align: "center" });

    doc.setFontSize(10);
    doc.text("LIBRARY CARD", pageW / 2, topY + 25, { align: "center" });

    // --- DETAILS SECTION ---
    doc.setTextColor(0, 0, 0);
    const detailsX = margin + 10;
    let currentY = topY + 36;
    const lineHeight = 6.5;

    // Photo Box (Right side)
    const photoW = 30;
    const photoH = 35;
    const photoX = margin + boxW - photoW - 10;
    const photoY = topY + 35;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(photoX, photoY, photoW, photoH);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Paste", photoX + photoW / 2, photoY + photoH / 2 - 2, { align: "center" });
    doc.text("Photograph", photoX + photoW / 2, photoY + photoH / 2 + 2, { align: "center" });
    doc.text("Here", photoX + photoW / 2, photoY + photoH / 2 + 6, { align: "center" });

    // Details Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const labelW = 35;

    const addDetail = (label: string, value: string, boldValue = false, highlight = false) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, detailsX, currentY);

      if (highlight) {
        doc.setTextColor(...greenColor);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(value, detailsX + labelW, currentY);
        doc.setFontSize(10); // Reset
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
      } else {
        doc.setFont("helvetica", boldValue ? "bold" : "normal");
        doc.text(value, detailsX + labelW, currentY);
      }
      currentY += lineHeight;
    };

    addDetail("Name:", `${app.firstName} ${app.lastName}`, true, true);
    addDetail("Father Name:", app.fatherName || "-");
    addDetail("Date of Birth:", app.dob ? new Date(app.dob).toLocaleDateString('en-GB') : "-");
    addDetail("Class:", app.class, true, true);
    addDetail("Field:", app.field ? `${app.field} (${getFieldCode(app.field)})` : "-", true, true);
    addDetail("Roll Number:", app.rollNo);

    // HIGHLIGHT LIBRARY CARD ID
    currentY += 1; // Extra spacing
    addDetail("Library Card ID:", app.cardNumber, true, true);
    currentY += 1;

    addDetail("Issue Date:", app.issueDate ? new Date(app.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'));
    addDetail("Valid Through:", app.validThrough ? new Date(app.validThrough).toLocaleDateString('en-GB') : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-GB'));

    // QR Code (Bottom Right of Front Box)
    const qrSize = 25;
    const qrX = margin + boxW - qrSize - 10;
    const qrY = topY + boxH - qrSize - 10;
    doc.addImage(qrCodeDataUrl, "JPEG", qrX, qrY, qrSize, qrSize);

    // Signature (Between Valid Through text and QR Code)
    const sigLineX = detailsX + 80;
    const sigLineY = qrY + qrSize - 5;
    const sigLineW = 45;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(sigLineX, sigLineY, sigLineX + sigLineW, sigLineY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); // Size 9 for better visibility
    doc.text("Principal's Signature", sigLineX + sigLineW / 2, sigLineY + 5, { align: "center" });

    // ==========================================
    // BOTTOM HALF - BACK SIDE
    // ==========================================

    // Border (Curved)
    doc.setDrawColor(...greenColor);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, botY, boxW, boxH, cornerRadius, cornerRadius, "S");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TERMS & CONDITIONS", pageW / 2, botY + 15, { align: "center" });

    // Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); // Reduced size to fit
    doc.setTextColor(0, 0, 0);

    let termY = botY + 25;
    const termX = margin + 12;
    const termSpacing = 5;

    const terms = [
      "• Login using your Library Card ID",
      "  Example: CS-E-99-12",
      "• Use the password created at the time of application.",
      "• Your library card will work only after approval by the library administration.",
      "• If you forget your password:",
      "  - Contact the library",
      "  - Your existing card will be deleted",
      "  - You must apply again for a new library card",
      "• This card is NOT TRANSFERABLE.",
      "• If lost, stolen, or damaged, report immediately to the GCMN Library.",
      "• The college is not responsible for misuse of the card.",
      "• If found, please return to Government College for Men Nazimabad.",
    ];

    terms.forEach(line => {
      doc.text(line, termX, termY);
      termY += termSpacing;
    });

    // Contact Details
    termY += 4;
    doc.setFont("helvetica", "bold");
    doc.text("CONTACT DETAILS:", termX, termY);
    termY += termSpacing;
    doc.setFont("helvetica", "normal");
    doc.text("Library, GCMN, Nazimabad, Karachi", termX, termY);
    termY += termSpacing;
    doc.text("Email: library@gcmn.edu.pk", termX, termY);

    doc.save(`library-card-${app.cardNumber}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const downloadExcel = () => {
    if (filteredApplications.length === 0) {
      toast({
        title: "No Data",
        description: "No library card entries to download.",
        variant: "destructive",
      });
      return;
    }

    const excelData = filteredApplications.map((app, index) => ({
      "Serial No": index + 1,
      "Library Card ID": app.cardNumber,
      "Student Name": `${app.firstName} ${app.lastName}`,
      "Father Name": app.fatherName || "-",
      "Date of Birth": app.dob ? new Date(app.dob).toLocaleDateString("en-GB") : "-",
      "Email Address": app.email || "-",
      "Phone Number": app.phone || "-",
      "Street Address": app.addressStreet || "-",
      "Status": app.status.charAt(0).toUpperCase() + app.status.slice(1),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 15 },
      { wch: 22 },
      { wch: 15 },
      { wch: 25 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Library Cards");
    XLSX.writeFile(workbook, "library_cards.xlsx");

    toast({
      title: "Success",
      description: `Downloaded Excel file with ${filteredApplications.length} library card entries.`,
    });
  };

  const generateBulkPDF = () => {
    if (filteredApplications.length === 0) {
      toast({
        title: "No Data",
        description: "No library card entries to download.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a4", true); // Enable compression

    doc.setFillColor(22, 78, 59);
    doc.rect(0, 0, 297, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GCMN Library - Library Card Applications Report", 148.5, 12, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148.5, 17, { align: "center" });

    let y = 30;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const rowHeight = 7;
    const colWidths = [12, 22, 25, 22, 18, 22, 18, 22, 25, 18];
    const columns = ["S.No", "Card ID", "Student Name", "Father Name", "DOB", "Email", "Phone", "Address", "Status", "Date"];

    // Table header
    doc.setFillColor(200, 220, 200);
    doc.setTextColor(22, 78, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    let x = margin;
    columns.forEach((col, i) => {
      doc.text(col, x, y, { maxWidth: colWidths[i] - 2 });
      x += colWidths[i];
    });

    y += rowHeight;
    doc.setDrawColor(150, 150, 150);
    doc.line(margin, y - 2, 287 - margin, y - 2);

    // Table rows
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);

    filteredApplications.forEach((app, index) => {
      if (y + rowHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;

        // Repeat header on new page
        doc.setFillColor(200, 220, 200);
        doc.setTextColor(22, 78, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);

        x = margin;
        columns.forEach((col, i) => {
          doc.text(col, x, y, { maxWidth: colWidths[i] - 2 });
          x += colWidths[i];
        });

        y += rowHeight;
        doc.setDrawColor(150, 150, 150);
        doc.line(margin, y - 2, 287 - margin, y - 2);

        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
      }

      x = margin;
      const rowData = [
        (index + 1).toString(),
        app.cardNumber,
        `${app.firstName} ${app.lastName}`,
        app.fatherName || "-",
        app.dob ? new Date(app.dob).toLocaleDateString('en-GB') : "-",
        app.email || "-",
        app.phone || "-",
        `${app.addressStreet || ''} ${app.addressCity || ''}`.trim() || "-",
        app.status,
        new Date(app.createdAt).toLocaleDateString('en-GB')
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x, y, { maxWidth: colWidths[i] - 2 });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    doc.save(`gcmn-library-cards-report-${new Date().getTime()}.pdf`);

    toast({
      title: "Success",
      description: `Downloaded PDF with ${filteredApplications.length} library card entries.`,
    });
  };

  const filteredApplications = applications.filter(app => {
    const search = searchQuery.toLowerCase();
    return (
      app.cardNumber.toLowerCase().includes(search) ||
      app.firstName.toLowerCase().includes(search) ||
      app.lastName.toLowerCase().includes(search) ||
      app.rollNo.toLowerCase().includes(search) ||
      app.email.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Library Card Applications</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, card ID, roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-applications"
                />
              </div>
              <Button variant="outline" onClick={downloadExcel} className="gap-2" data-testid="button-download-excel">
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </Button>
              <Button variant="outline" onClick={generateBulkPDF} className="gap-2" data-testid="button-download-bulk-pdf">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={fetchApplications} className="gap-2" data-testid="button-refresh-applications">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Applications ({filteredApplications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Library Card ID</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Father Name</TableHead>
                        <TableHead>Date of Birth</TableHead>
                        <TableHead>Email Address</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Street Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app, index) => (
                        <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                          <TableCell className="font-medium text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-primary font-medium">
                            {app.cardNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {app.firstName} {app.lastName}
                          </TableCell>
                          <TableCell>
                            {app.fatherName || '-'}
                          </TableCell>
                          <TableCell>
                            {app.dob ? new Date(app.dob).toLocaleDateString('en-GB') : '-'}
                          </TableCell>
                          <TableCell>
                            {app.email || '-'}
                          </TableCell>
                          <TableCell>
                            {app.phone || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {app.addressStreet || '-'}
                          </TableCell>
                          <TableCell>
                            {app.status?.toLowerCase() === 'pending' ? (
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStatus(app.id, 'approved')}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  data-testid={`button-approve-${app.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStatus(app.id, 'rejected')}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  data-testid={`button-reject-${app.id}`}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : app.status?.toLowerCase() === 'approved' ? (
                              <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>
                            ) : app.status?.toLowerCase() === 'rejected' ? (
                              <Badge variant="destructive">Rejected</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => generatePDF(app)}
                                title="Download PDF"
                                data-testid={`button-download-${app.id}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => deleteApplication(app.id)}
                                className="text-destructive hover:text-destructive"
                                title="Delete"
                                data-testid={`button-delete-${app.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LibraryCards;
