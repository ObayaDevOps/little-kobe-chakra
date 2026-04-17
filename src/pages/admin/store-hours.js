import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Heading,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import AdminNavbar from '@/components/admin/AdminNavbar';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Display order: Mon–Sun (1–6, then 0)
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_HOURS = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  open_time: '10:00',
  close_time: '19:00',
  is_closed: false,
}));

function toInputTime(timeStr) {
  // Converts "10:00:00" or "10:00" → "10:00"
  if (!timeStr) return '10:00';
  return timeStr.slice(0, 5);
}

export default function StoreHoursPage() {
  const toast = useToast();
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadHours() {
      try {
        const res = await fetch('/api/admin/store-hours');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load');

        if (data.hours && data.hours.length === 7) {
          const normalized = data.hours.map(row => ({
            ...row,
            open_time: toInputTime(row.open_time),
            close_time: toInputTime(row.close_time),
          }));
          setHours(normalized);
        }
      } catch (err) {
        toast({
          title: 'Failed to load store hours',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadHours();
  }, []);

  const updateRow = (dayOfWeek, field, value) => {
    setHours(prev =>
      prev.map(row =>
        row.day_of_week === dayOfWeek ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = async () => {
    // Validate close time is after open time for non-closed days
    for (const row of hours) {
      if (!row.is_closed && row.close_time <= row.open_time) {
        toast({
          title: 'Invalid hours',
          description: `Close time must be after open time for ${DAY_NAMES[row.day_of_week]}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/store-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      toast({
        title: 'Store hours saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (err) {
      toast({
        title: 'Failed to save store hours',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <Container maxW="3xl" py={12}>
        <Stack spacing={6}>
          <Box>
            <Heading as="h1" size="lg" mb={2}>Set Open & Close Times</Heading>
            <Text color="gray.600">
              Configure operating hours per day of the week. All times are in EAT (East Africa Time, UTC+3).
              Default is 10:00 AM – 7:00 PM every day.
            </Text>
          </Box>

          <Box
            borderWidth="1px"
            borderRadius="lg"
            borderColor="gray.200"
            bg="white"
            overflow="hidden"
            boxShadow="sm"
          >
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th fontFamily="nbHeading">Day</Th>
                  <Th fontFamily="nbHeading">Open Time (EAT)</Th>
                  <Th fontFamily="nbHeading">Close Time (EAT)</Th>
                  <Th fontFamily="nbHeading">Closed All Day</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center" py={8} color="gray.500">
                      Loading...
                    </Td>
                  </Tr>
                ) : (
                  DISPLAY_ORDER.map(dayIndex => {
                    const row = hours.find(r => r.day_of_week === dayIndex);
                    if (!row) return null;
                    return (
                      <Tr key={dayIndex} opacity={row.is_closed ? 0.5 : 1}>
                        <Td fontFamily="nbText" fontWeight="medium">
                          {DAY_NAMES[dayIndex]}
                        </Td>
                        <Td>
                          <input
                            type="time"
                            value={row.open_time}
                            disabled={row.is_closed}
                            onChange={e => updateRow(dayIndex, 'open_time', e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E0',
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              cursor: row.is_closed ? 'not-allowed' : 'text',
                            }}
                          />
                        </Td>
                        <Td>
                          <input
                            type="time"
                            value={row.close_time}
                            disabled={row.is_closed}
                            onChange={e => updateRow(dayIndex, 'close_time', e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: !row.is_closed && row.close_time <= row.open_time
                                ? '2px solid #E53E3E'
                                : '1px solid #CBD5E0',
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              cursor: row.is_closed ? 'not-allowed' : 'text',
                            }}
                          />
                        </Td>
                        <Td>
                          <Checkbox
                            isChecked={row.is_closed}
                            onChange={e => updateRow(dayIndex, 'is_closed', e.target.checked)}
                            colorScheme="red"
                          />
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Box>

          <Button
            colorScheme="teal"
            size="lg"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
            alignSelf="flex-start"
          >
            Save All Hours
          </Button>
        </Stack>
      </Container>
    </>
  );
}
