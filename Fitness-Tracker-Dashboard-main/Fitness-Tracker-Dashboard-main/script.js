      const stats = [];
        const statsList = document.getElementById('statsList');
        const chartCanvas = document.getElementById('progressChart');
        let chart;

        function addEntry() {
            const date = document.getElementById('date').value;
            const steps = parseInt(document.getElementById('steps').value);
            const calories = parseInt(document.getElementById('calories').value);
            const water = parseFloat(document.getElementById('water').value);
            const sleep = parseFloat(document.getElementById('sleep').value);

            if (!date || isNaN(steps) || isNaN(calories) || isNaN(water) || isNaN(sleep)) {
                alert('Please fill out all fields.');
                return;
            }

            const entry = { date, steps, calories, water, sleep };
            stats.push(entry);
            updateStats();
            updateChart();
        }

        function updateStats() {
            statsList.innerHTML = stats.map(s =>
                `<li><strong>${s.date}</strong> – Steps: ${s.steps}, Calories: ${s.calories}, Water: ${s.water}L, Sleep: ${s.sleep}h</li>`
            ).join('');
        }

        function updateChart() {
            const labels = stats.map(s => s.date);
            const stepsData = stats.map(s => s.steps);
            const caloriesData = stats.map(s => s.calories);

            if (chart) chart.destroy();

            chart = new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Steps',
                            data: stepsData,
                            borderColor: '#00c9a7',
                            backgroundColor: 'rgba(0, 201, 167, 0.1)',
                            fill: true
                        },
                        {
                            label: 'Calories',
                            data: caloriesData,
                            borderColor: '#ff7675',
                            backgroundColor: 'rgba(255, 118, 117, 0.1)',
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#fff' } },
                    },
                    scales: {
                        x: { ticks: { color: '#fff' } },
                        y: { ticks: { color: '#fff' } }
                    }
                }
            });
        }