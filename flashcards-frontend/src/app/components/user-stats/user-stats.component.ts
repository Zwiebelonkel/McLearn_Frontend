import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { UserStatistics } from '../../models';
import { BaseChartDirective } from 'ng2-charts';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  RadarController,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

@Component({
  selector: 'app-user-statistics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, TranslateModule],
  templateUrl: './user-stats.component.html',
  styleUrls: ['./user-stats.component.scss']
})
export class UserStatisticsComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  @Input() userId!: number;
  @Input() isOwnProfile: boolean = false;
  
  stats = signal<UserStatistics | null>(null);
  loading = signal(false);
  isInitialized = false;

  // Chart Options
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { display: false },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#888', stepSize: 1 },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#fff',
        bodyColor: '#ddd',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    }
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: '#888', maxRotation: 45, minRotation: 0 },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#888', stepSize: 1 },
        grid: { color: 'rgba(255,255,255,0.08)' }
      }
    },
    plugins: {
      legend: { 
        display: true,
        position: 'bottom',
        labels: { color: '#aaa', padding: 15, font: { size: 11 } }
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#fff',
        bodyColor: '#ddd',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    }
  };

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'right',
        labels: { color: '#aaa', padding: 10, font: { size: 11 } }
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#fff',
        bodyColor: '#ddd',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    }
  };

  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        ticks: { color: '#888', backdropColor: 'transparent' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#aaa', font: { size: 11 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#fff',
        bodyColor: '#ddd',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    }
  };

  topStacksChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  mostReviewedStacksChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  boxDistributionChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  activityChartData: ChartData<'line'> = { labels: [], datasets: [] };
  weeklyChartData: ChartData<'radar'> = { labels: [], datasets: [] };

  constructor() {
    Chart.register(
      BarController,
      BarElement,
      CategoryScale,
      LinearScale,
      LineController,
      LineElement,
      PointElement,
      DoughnutController,
      RadarController,
      RadialLinearScale,
      ArcElement,
      Tooltip,
      Legend
    );
  }

  ngOnInit() {
    if (this.userId && !this.isInitialized) {
      this.loadStatistics();
      this.isInitialized = true;
    }
  }

  loadStatistics() {
    if (!this.userId) return;
    
    this.loading.set(true);
    this.api.getUserStatistics(this.userId).subscribe({
      next: stats => {
        this.stats.set(stats);
        if (!stats.limited) {
          this.setupCharts();
        }
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading user statistics:', err);
        this.loading.set(false);
      }
    });
  }

  private truncate(text: string, max = 18): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  // ✅ NEW: Format stack name with privacy indicator
  private formatStackName(stack: any): string {
    const truncated = this.truncate(stack.name);
    if (stack.is_anonymous) {
      return `🔒 ${truncated}`;
    }
    return truncated;
  }

  setupCharts() {
    const s = this.stats();
    if (!s || s.limited) return;

    // Top Stacks by Performance
    this.topStacksChartData = {
      labels: s.topStacks.map(stack => this.formatStackName(stack)),
      datasets: [{
        data: s.topStacks.map(stack => stack.average_box),
        backgroundColor: '#4ade80',
        hoverBackgroundColor: '#6ee7b7',
        borderRadius: 6
      }]
    };

    // Most Reviewed Stacks
    this.mostReviewedStacksChartData = {
      labels: s.mostReviewedStacks.map(stack => this.formatStackName(stack)),
      datasets: [{
        data: s.mostReviewedStacks.map(stack => stack.total_reviews),
        backgroundColor: '#4dd5ff',
        hoverBackgroundColor: '#6ee0ff',
        borderRadius: 6
      }]
    };

    // Box Distribution
    const sortedBoxes = s.boxDistribution.sort((a, b) => a.box - b.box);
    this.boxDistributionChartData = {
      labels: sortedBoxes.map(b => `Box ${b.box}`),
      datasets: [{
        data: sortedBoxes.map(b => b.count),
        backgroundColor: [
          '#ef4444',
          '#f97316',
          '#f59e0b',
          '#eab308',
          '#84cc16',
          '#22c55e',
          '#10b981'
        ],
        hoverOffset: 8,
        borderWidth: 2,
        borderColor: '#111'
      }]
    };

    // Recent Activity
    const recentDays = s.recentActivity.slice(-14).reverse();
    this.activityChartData = {
      labels: recentDays.map(a => new Date(a.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })),
      datasets: [
        {
          label: this.translate.instant('stats.response_distribution.hard'),
          data: recentDays.map(a => a.hard_count),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: this.translate.instant('stats.response_distribution.good'),
          data: recentDays.map(a => a.good_count),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: this.translate.instant('stats.response_distribution.easy'),
          data: recentDays.map(a => a.easy_count),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };

    // Weekly Activity Pattern (Radar)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = new Array(7).fill(0);
    s.weeklyStats.forEach(stat => {
      weeklyData[stat.day_of_week] = stat.review_count;
    });

    this.weeklyChartData = {
      labels: dayNames.map(day => this.translate.instant(`user_stats.days.${day.toLowerCase()}`)),
      datasets: [{
        data: weeklyData,
        borderColor: '#c084fc',
        backgroundColor: 'rgba(192, 132, 252, 0.2)',
        pointBackgroundColor: '#c084fc',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#c084fc'
      }]
    };
  }

  get accuracyRate(): number {
    const s = this.stats();
    if (!s || s.limited) return 0;
    return s.overall.average_accuracy;
  }

  get difficultyRate(): number {
    const s = this.stats();
    if (!s || s.limited) return 0;
    
    const total = s.overall.total_reviews;
    if (total === 0) return 0;
    
    const difficult = s.overall.total_again + s.overall.total_hard;
    return Math.round((difficult / total) * 100);
  }

  getDaysOfWeek(): string[] {
    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(
      day => this.translate.instant(`user_stats.days.${day}`)
    );
  }
}