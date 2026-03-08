import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { format, subDays } from 'date-fns';
import API_BASE_URL from '../../config/api';
import './ReusableCharts.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * LineChart Component - For trends and forecasts
 */
export const LineChart = ({ title, data, options = {} }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12 }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { drawBorder: false },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-wrapper" style={{ height: '300px' }}>
        <Line data={data} options={{ ...defaultOptions, ...options }} />
      </div>
    </div>
  );
};

/**
 * BarChart Component - For comparisons
 */
export const BarChart = ({ title, data, options = {} }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { drawBorder: false },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-wrapper" style={{ height: '300px' }}>
        <Bar data={data} options={{ ...defaultOptions, ...options }} />
      </div>
    </div>
  );
};

/**
 * PieChart Component - For distributions
 */
export const PieChart = ({ title, data, options = {} }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 }, padding: 15 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 12 }
      }
    }
  };

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-wrapper" style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
        <Pie data={data} options={{ ...defaultOptions, ...options }} />
      </div>
    </div>
  );
};

/**
 * DoughnutChart Component - For donut charts
 */
export const DoughnutChart = ({ title, data, options = {} }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 }, padding: 15 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 12 }
      }
    }
  };

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-wrapper" style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
        <Doughnut data={data} options={{ ...defaultOptions, ...options }} />
      </div>
    </div>
  );
};

/**
 * SalesOverviewChart - Complete sales dashboard chart
 */
export const SalesOverviewChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          last7Days.push(format(subDays(new Date(), i), 'MMM dd'));
        }

        // Mock data - replace with real API call
        const response = await axios.get(`${API_BASE_URL}/api/orders`, {
          params: { limit: 100 }
        });

        const data = {
          labels: last7Days,
          datasets: [
            {
              label: 'Daily Revenue',
              data: [2500, 3200, 2800, 3500, 4100, 3800, 4200],
              borderColor: '#2980b9',
              backgroundColor: 'rgba(41, 128, 185, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointBackgroundColor: '#2980b9',
              pointHoverRadius: 7
            }
          ]
        };

        setChartData(data);
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError('Failed to load sales data');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  if (loading) return <div className="chart-loading">Loading chart...</div>;
  if (error) return <div className="chart-error">{error}</div>;
  if (!chartData) return null;

  return <LineChart title="Daily Sales Revenue (Last 7 Days)" data={chartData} />;
};

/**
 * CategoryBreakdownChart - Sales by category
 */
export const CategoryBreakdownChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        // Mock data - replace with real API call
        const data = {
          labels: ['Cocktails', 'Pasta', 'Sandwiches', 'Sides', 'Coffee'],
          datasets: [
            {
              label: 'Orders by Category',
              data: [85, 120, 95, 72, 48],
              backgroundColor: [
                'rgba(255, 107, 107, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 205, 86, 0.8)'
              ],
              borderColor: [
                'rgba(255, 107, 107, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 205, 86, 1)'
              ],
              borderWidth: 1
            }
          ]
        };

        setChartData(data);
      } catch (err) {
        console.error('Error fetching category data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  if (loading) return <div className="chart-loading">Loading chart...</div>;
  if (!chartData) return null;

  return <PieChart title="Orders by Category" data={chartData} />;
};

/**
 * OrderTypes Distribution Chart
 */
export const OrderTypesChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const data = {
      labels: ['Dine-in', 'Takeaway', 'Delivery'],
      datasets: [
        {
          data: [320, 180, 150],
          backgroundColor: [
            'rgba(52, 152, 219, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(230, 126, 34, 0.8)'
          ],
          borderColor: [
            'rgba(52, 152, 219, 1)',
            'rgba(46, 204, 113, 1)',
            'rgba(230, 126, 34, 1)'
          ],
          borderWidth: 1
        }
      ]
    };

    setChartData(data);
  }, []);

  if (!chartData) return null;

  return <DoughnutChart title="Order Types Distribution" data={chartData} />;
};

export default {
  LineChart,
  BarChart,
  PieChart,
  DoughnutChart,
  SalesOverviewChart,
  CategoryBreakdownChart,
  OrderTypesChart
};
