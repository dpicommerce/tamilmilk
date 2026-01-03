import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Loader2, 
  Send, 
  Users, 
  Truck, 
  CheckCircle2, 
  XCircle,
  Save,
  FileText,
  Trash2,
  Plus
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Customer {
  id: string;
  customer_id: string;
  name: string;
  phone: string | null;
  balance: number;
}

interface Supplier {
  id: string;
  supplier_id: string;
  name: string;
  phone: string | null;
  balance: number;
}

interface SendResult {
  name: string;
  phone: string;
  success: boolean;
  error?: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  message: string;
  template_type: 'customer' | 'supplier' | 'general';
}

export function SendSmsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [customerMessage, setCustomerMessage] = useState('');
  const [supplierMessage, setSupplierMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [customersRes, suppliersRes, templatesRes] = await Promise.all([
      supabase.from('customers').select('id, customer_id, name, phone, balance').order('name'),
      supabase.from('suppliers').select('id, supplier_id, name, phone, balance').order('name'),
      supabase.from('sms_templates').select('*').order('name'),
    ]);

    if (customersRes.data) {
      setCustomers(customersRes.data.filter(c => c.phone));
    }
    if (suppliersRes.data) {
      setSuppliers(suppliersRes.data.filter(s => s.phone));
    }
    if (templatesRes.data) {
      setTemplates(templatesRes.data as SmsTemplate[]);
    }

    setIsLoading(false);
  };

  const toggleCustomer = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const selectAllSuppliers = () => {
    if (selectedSuppliers.length === suppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(suppliers.map(s => s.id));
    }
  };

  const sendSms = async (phone: string, message: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to: phone, message }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleSaveTemplate = async () => {
    const message = activeTab === 'customers' ? customerMessage : supplierMessage;
    
    if (!newTemplateName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a template name',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message first',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingTemplate(true);

    const { data, error } = await supabase
      .from('sms_templates')
      .insert({
        name: newTemplateName.trim(),
        message: message.trim(),
        template_type: activeTab === 'customers' ? 'customer' : 'supplier',
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    } else {
      setTemplates([...templates, data as SmsTemplate]);
      setNewTemplateName('');
      setShowTemplateForm(false);
      toast({
        title: 'Success',
        description: 'Template saved successfully',
      });
    }

    setIsSavingTemplate(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('sms_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    } else {
      setTemplates(templates.filter(t => t.id !== templateId));
      toast({
        title: 'Success',
        description: 'Template deleted',
      });
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      if (activeTab === 'customers') {
        setCustomerMessage(template.message);
      } else {
        setSupplierMessage(template.message);
      }
    }
  };

  const getFilteredTemplates = () => {
    const type = activeTab === 'customers' ? 'customer' : 'supplier';
    return templates.filter(t => t.template_type === type || t.template_type === 'general');
  };

  const handleSendToCustomers = async () => {
    if (selectedCustomers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one customer',
        variant: 'destructive',
      });
      return;
    }

    if (!customerMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    const results: SendResult[] = [];

    for (const customerId of selectedCustomers) {
      const customer = customers.find(c => c.id === customerId);
      if (customer && customer.phone) {
        const personalizedMessage = customerMessage
          .replace(/{name}/g, customer.name)
          .replace(/{balance}/g, `₹${Math.abs(customer.balance).toLocaleString('en-IN')}`);
        
        const result = await sendSms(customer.phone, personalizedMessage);
        results.push({
          name: customer.name,
          phone: customer.phone,
          success: result.success,
          error: result.error,
        });
      }
    }

    setSendResults(results);
    setShowResults(true);
    setIsSending(false);

    const successCount = results.filter(r => r.success).length;
    toast({
      title: 'SMS Sent',
      description: `Successfully sent to ${successCount}/${results.length} customers`,
      variant: successCount > 0 ? 'default' : 'destructive',
    });
  };

  const handleSendToSuppliers = async () => {
    if (selectedSuppliers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one supplier',
        variant: 'destructive',
      });
      return;
    }

    if (!supplierMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    const results: SendResult[] = [];

    for (const supplierId of selectedSuppliers) {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (supplier && supplier.phone) {
        const personalizedMessage = supplierMessage
          .replace(/{name}/g, supplier.name)
          .replace(/{balance}/g, `₹${Math.abs(supplier.balance).toLocaleString('en-IN')}`);
        
        const result = await sendSms(supplier.phone, personalizedMessage);
        results.push({
          name: supplier.name,
          phone: supplier.phone,
          success: result.success,
          error: result.error,
        });
      }
    }

    setSendResults(results);
    setShowResults(true);
    setIsSending(false);

    const successCount = results.filter(r => r.success).length;
    toast({
      title: 'SMS Sent',
      description: `Successfully sent to ${successCount}/${results.length} suppliers`,
      variant: successCount > 0 ? 'default' : 'destructive',
    });
  };

  const resetDialog = () => {
    setSelectedCustomers([]);
    setSelectedSuppliers([]);
    setCustomerMessage('');
    setSupplierMessage('');
    setSendResults([]);
    setShowResults(false);
    setShowTemplateForm(false);
    setNewTemplateName('');
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Send Messages
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Send SMS Messages
          </DialogTitle>
        </DialogHeader>

        {showResults ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Send Results</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {sendResults.map((result, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.success ? 'bg-success/10' : 'bg-destructive/10'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-muted-foreground">{result.phone}</p>
                    </div>
                    {result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-destructive">{result.error}</span>
                        <XCircle className="w-5 h-5 text-destructive" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={() => setShowResults(false)} className="w-full">
              Send More Messages
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'customers' | 'suppliers')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customers" className="gap-2">
                <Users className="w-4 h-4" />
                Customers ({customers.length})
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="gap-2">
                <Truck className="w-4 h-4" />
                Suppliers ({suppliers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Select Customers</Label>
                <Button variant="ghost" size="sm" onClick={selectAllCustomers}>
                  {selectedCustomers.length === customers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <ScrollArea className="h-[150px] border rounded-lg p-2">
                {customers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No customers with phone numbers
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                        onClick={() => toggleCustomer(customer.id)}
                      >
                        <Checkbox
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={() => toggleCustomer(customer.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.phone} • Balance: ₹{Math.abs(customer.balance).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Template Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Use Template
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Select onValueChange={handleSelectTemplate}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTemplates.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No templates saved</div>
                      ) : (
                        filteredTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {filteredTemplates.length > 0 && (
                    <Select onValueChange={handleDeleteTemplate}>
                      <SelectTrigger className="w-[100px]">
                        <Trash2 className="w-4 h-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id} className="text-destructive">
                            Delete: {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="customerMessage" className="text-base">Message</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Use {'{name}'} for customer name and {'{balance}'} for balance
                </p>
                <Textarea
                  id="customerMessage"
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  placeholder="Dear {name}, please verify your milk quantity. Your current balance is {balance}. Thank you!"
                  className="min-h-[80px]"
                />
              </div>

              {/* Save Template */}
              {showTemplateForm ? (
                <div className="flex gap-2">
                  <Input
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Template name..."
                    className="flex-1"
                  />
                  <Button onClick={handleSaveTemplate} disabled={isSavingTemplate} size="sm">
                    {isSavingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowTemplateForm(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowTemplateForm(true)}
                  disabled={!customerMessage.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save as Template
                </Button>
              )}

              <Button 
                onClick={handleSendToCustomers} 
                className="w-full gap-2"
                disabled={isSending || selectedCustomers.length === 0}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send to {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? 's' : ''}
              </Button>
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Select Suppliers</Label>
                <Button variant="ghost" size="sm" onClick={selectAllSuppliers}>
                  {selectedSuppliers.length === suppliers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <ScrollArea className="h-[150px] border rounded-lg p-2">
                {suppliers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No suppliers with phone numbers
                  </p>
                ) : (
                  <div className="space-y-2">
                    {suppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                        onClick={() => toggleSupplier(supplier.id)}
                      >
                        <Checkbox
                          checked={selectedSuppliers.includes(supplier.id)}
                          onCheckedChange={() => toggleSupplier(supplier.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {supplier.phone} • Balance: ₹{Math.abs(supplier.balance).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Template Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Use Template
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Select onValueChange={handleSelectTemplate}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTemplates.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No templates saved</div>
                      ) : (
                        filteredTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {filteredTemplates.length > 0 && (
                    <Select onValueChange={handleDeleteTemplate}>
                      <SelectTrigger className="w-[100px]">
                        <Trash2 className="w-4 h-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id} className="text-destructive">
                            Delete: {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="supplierMessage" className="text-base">Message</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Use {'{name}'} for supplier name and {'{balance}'} for balance
                </p>
                <Textarea
                  id="supplierMessage"
                  value={supplierMessage}
                  onChange={(e) => setSupplierMessage(e.target.value)}
                  placeholder="Dear {name}, please verify your milk supply quantity. Your current balance is {balance}. Thank you!"
                  className="min-h-[80px]"
                />
              </div>

              {/* Save Template */}
              {showTemplateForm ? (
                <div className="flex gap-2">
                  <Input
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Template name..."
                    className="flex-1"
                  />
                  <Button onClick={handleSaveTemplate} disabled={isSavingTemplate} size="sm">
                    {isSavingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowTemplateForm(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowTemplateForm(true)}
                  disabled={!supplierMessage.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save as Template
                </Button>
              )}

              <Button 
                onClick={handleSendToSuppliers} 
                className="w-full gap-2"
                disabled={isSending || selectedSuppliers.length === 0}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send to {selectedSuppliers.length} Supplier{selectedSuppliers.length !== 1 ? 's' : ''}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
