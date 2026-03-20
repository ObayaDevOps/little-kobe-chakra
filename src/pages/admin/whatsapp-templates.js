import { useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Container,
    Divider,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Select,
    Stack,
    Switch,
    Text,
    Textarea,
    useToast,
    Code,
    SimpleGrid,
} from '@chakra-ui/react';
import AdminNavbar from '@/components/admin/AdminNavbar';

const EMPTY_FORM = {
    id: '',
    name: '',
    slug: '',
    providerScope: 'baileys_wa',
    bodyText: '',
    isActive: true,
};

function WhatsAppTemplatesPage() {
    const toast = useToast();
    const [templates, setTemplates] = useState([]);
    const [defaultTemplate, setDefaultTemplate] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState('');
    const [isPreviewing, setIsPreviewing] = useState(false);

    const isEditing = useMemo(() => Boolean(form.id), [form.id]);

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/whatsapp-templates?includeInactive=true');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to load templates');
            }
            setTemplates(Array.isArray(data.templates) ? data.templates : []);
            setDefaultTemplate(data.defaultTemplate || null);
        } catch (error) {
            toast({
                title: 'Failed to load templates',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setPreview('');
    };

    const saveTemplate = async (event) => {
        event.preventDefault();
        if (!form.name.trim() || !form.bodyText.trim()) {
            toast({
                title: 'Missing required fields',
                description: 'Template name and body text are required.',
                status: 'warning',
                duration: 4000,
                isClosable: true,
                position: 'top',
            });
            return;
        }

        try {
            setIsSaving(true);
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing
                ? `/api/admin/whatsapp-templates/${form.id}`
                : '/api/admin/whatsapp-templates';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: form.name,
                    slug: form.slug,
                    providerScope: form.providerScope,
                    bodyText: form.bodyText,
                    isActive: form.isActive,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || 'Save failed');
            }

            toast({
                title: isEditing ? 'Template updated' : 'Template created',
                status: 'success',
                duration: 4000,
                isClosable: true,
                position: 'top',
            });
            resetForm();
            await loadTemplates();
        } catch (error) {
            toast({
                title: 'Save failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const startEdit = (template) => {
        setForm({
            id: template.id,
            name: template.name,
            slug: template.slug,
            providerScope: template.providerScope || 'all',
            bodyText: template.bodyText || '',
            isActive: Boolean(template.isActive),
        });
        setPreview('');
    };

    const deleteTemplate = async (template) => {
        if (!confirm(`Delete template "${template.name}"?`)) {
            return;
        }
        try {
            const response = await fetch(`/api/admin/whatsapp-templates/${template.id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || 'Delete failed');
            }
            toast({
                title: 'Template deleted',
                status: 'success',
                duration: 4000,
                isClosable: true,
                position: 'top',
            });
            if (form.id === template.id) {
                resetForm();
            }
            await loadTemplates();
        } catch (error) {
            toast({
                title: 'Delete failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
        }
    };

    const generatePreview = async () => {
        if (!form.bodyText.trim()) {
            setPreview('');
            return;
        }
        try {
            setIsPreviewing(true);
            const response = await fetch('/api/admin/whatsapp-templates', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bodyText: form.bodyText,
                    sampleOrderDetails: {
                        customerName: 'Minori',
                        items: [{ name: 'NIKKA Whisky Miyagikyo (宮城峡)', quantity: 1 }],
                        deliveryLocationText: 'Yamasen',
                        customerPhoneNumber: '+256776193602',
                        status: 'Payment pending / to be confirmed',
                    },
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || 'Preview failed');
            }
            setPreview(data.previewText || '');
        } catch (error) {
            toast({
                title: 'Preview failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
        } finally {
            setIsPreviewing(false);
        }
    };

    return (
        <>
            <AdminNavbar />
            <Container maxW="6xl" py={12}>
                <Stack spacing={6}>
                    <Heading as="h1" size="lg">WhatsApp Templates</Heading>
                    <Text color="gray.600">
                        Support can manage reusable WhatsApp text templates for Baileys messages here. Use placeholders like
                        <Code mx={2}>{'{{customerName}}'}</Code>
                        and
                        <Code mx={2}>{'{{itemsLine}}'}</Code>
                        in the message body.
                    </Text>

                    {defaultTemplate && (
                        <Box borderWidth="1px" borderRadius="lg" p={4} bg="gray.50">
                            <Text fontWeight="semibold" mb={2}>Fallback template used when no custom template is active</Text>
                            <Text fontSize="sm" color="gray.600">{defaultTemplate.name} ({defaultTemplate.slug})</Text>
                        </Box>
                    )}

                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                        <Box as="form" onSubmit={saveTemplate} borderWidth="1px" borderRadius="lg" p={5}>
                            <Stack spacing={4}>
                                <Heading as="h2" size="md">{isEditing ? 'Edit template' : 'Create template'}</Heading>
                                <FormControl>
                                    <FormLabel>Name</FormLabel>
                                    <Input
                                        value={form.name}
                                        onChange={(event) => updateField('name', event.target.value)}
                                        placeholder="New Website Order - Action Required"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Slug (optional)</FormLabel>
                                    <Input
                                        value={form.slug}
                                        onChange={(event) => updateField('slug', event.target.value)}
                                        placeholder="new-website-order-action-required"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Provider scope</FormLabel>
                                    <Select
                                        value={form.providerScope}
                                        onChange={(event) => updateField('providerScope', event.target.value)}
                                    >
                                        <option value="baileys_wa">Baileys only</option>
                                        <option value="meta_api">Meta only</option>
                                        <option value="all">All providers</option>
                                    </Select>
                                </FormControl>
                                <FormControl display="flex" alignItems="center">
                                    <FormLabel mb="0">Active</FormLabel>
                                    <Switch
                                        isChecked={form.isActive}
                                        onChange={(event) => updateField('isActive', event.target.checked)}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Body text</FormLabel>
                                    <Textarea
                                        rows={14}
                                        value={form.bodyText}
                                        onChange={(event) => updateField('bodyText', event.target.value)}
                                        placeholder="Enter template body..."
                                    />
                                </FormControl>
                                <Stack direction="row">
                                    <Button
                                        type="button"
                                        onClick={generatePreview}
                                        isLoading={isPreviewing}
                                        loadingText="Rendering"
                                        variant="outline"
                                    >
                                        Preview
                                    </Button>
                                    <Button
                                        type="submit"
                                        colorScheme="teal"
                                        isLoading={isSaving}
                                        loadingText={isEditing ? 'Updating' : 'Creating'}
                                    >
                                        {isEditing ? 'Update template' : 'Create template'}
                                    </Button>
                                    <Button type="button" onClick={resetForm} variant="ghost">
                                        Reset
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>

                        <Box borderWidth="1px" borderRadius="lg" p={5}>
                            <Heading as="h2" size="md" mb={3}>Preview output</Heading>
                            {preview ? (
                                <Code whiteSpace="pre-wrap" display="block" p={3} w="full">
                                    {preview}
                                </Code>
                            ) : (
                                <Text color="gray.500">Use Preview to render this template with sample order data.</Text>
                            )}
                        </Box>
                    </SimpleGrid>

                    <Divider />

                    <Box>
                        <Heading as="h2" size="md" mb={3}>Saved templates</Heading>
                        <Stack spacing={3}>
                            {isLoading ? (
                                <Text color="gray.500">Loading templates...</Text>
                            ) : templates.length > 0 ? (
                                templates.map((template) => (
                                    <Box key={template.id} borderWidth="1px" borderRadius="md" p={4}>
                                        <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }}>
                                            <Box>
                                                <Heading as="h3" size="sm">{template.name}</Heading>
                                                <Text fontSize="sm" color="gray.600">{template.slug}</Text>
                                                <Stack direction="row" mt={1}>
                                                    <Badge colorScheme={template.isActive ? 'green' : 'gray'}>
                                                        {template.isActive ? 'active' : 'inactive'}
                                                    </Badge>
                                                    <Badge colorScheme="purple">
                                                        {template.providerScope}
                                                    </Badge>
                                                </Stack>
                                            </Box>
                                            <Stack direction="row">
                                                <Button size="sm" onClick={() => startEdit(template)}>Edit</Button>
                                                <Button size="sm" colorScheme="red" variant="outline" onClick={() => deleteTemplate(template)}>
                                                    Delete
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                ))
                            ) : (
                                <Text color="gray.500">No templates saved yet.</Text>
                            )}
                        </Stack>
                    </Box>
                </Stack>
            </Container>
        </>
    );
}

export default WhatsAppTemplatesPage;
