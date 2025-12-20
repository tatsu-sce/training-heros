import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useOccupancyHistory = (campusId, currentCount) => {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    const timeSlots = [
        '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
    ];

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Get start of today (local time?? Or UTC relative?)
                // Assuming logs are UTC, but we display local.
                // Simple approach: Get logs from last 24h or since midnight local.
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

                const { data: logs, error } = await supabase
                    .from('occupancy_logs')
                    .select('created_at, action')
                    .eq('location', campusId)
                    .gte('created_at', startOfDay)
                    .order('created_at', { ascending: false }); // Latest first

                if (error) throw error;

                // Reconstruct timeline backwards
                // We know currentCount at 'now'.
                // Walk back: if we see 'check_in', count was -1. 'check_out', count was +1.
                
                let runningCount = currentCount || 0;
                const timeline = [{ time: now.getTime(), count: runningCount }];

                logs.forEach(log => {
                    const logTime = new Date(log.created_at).getTime();
                    // Before this action happened, what was the count?
                    if (log.action === 'check_in') {
                        // Action was +1, so previous was -1
                        runningCount -= 1;
                    } else {
                        // Action was -1, so previous was +1
                        runningCount += 1;
                    }
                    timeline.push({ time: logTime, count: runningCount });
                });

                // Correct timeline: The 'runningCount' we computed is the state *before* the log.
                // But effectively the state changed AT logTime.
                // So the interval [logTime_prev, logTime_current] has status...
                // Wait, easier forward replay if we know start count?
                // But we don't know start count reliable (could be non-zero if people stayed overnight).
                // Reverse replay is safer if we trust currentCount.

                // Now map to 30min slots
                // Sort timeline ascending for easy slot filling
                timeline.sort((a, b) => a.time - b.time);

                const slotMaxCounts = timeSlots.map(slot => {
                    const [h, m] = slot.split(':').map(Number);
                    const slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
                    const slotEnd = slotStart + 30 * 60 * 1000;
                    
                    // Filter points within this slot
                    // And also consider the state at the START of the slot.
                    // Find effective count at slotStart: last point before slotStart.
                    
                    if (slotStart > now.getTime()) return null; // Future

                    let effectiveCount = 0;
                    const prevPoint = timeline.filter(t => t.time <= slotStart).pop();
                    if (prevPoint) effectiveCount = prevPoint.count;

                    let maxInSlot = effectiveCount;
                    
                    // Check all points inside slot
                    const pointsInSlot = timeline.filter(t => t.time > slotStart && t.time <= slotEnd);
                    pointsInSlot.forEach(p => {
                        if (p.count > maxInSlot) maxInSlot = p.count;
                    });
                    
                    return Math.max(0, maxInSlot);
                });

                setHistoryData(slotMaxCounts);

            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        };

        if (typeof currentCount === 'number') {
            fetchHistory();
        }
    }, [campusId, currentCount]);

    return { historyData, loading };
};
