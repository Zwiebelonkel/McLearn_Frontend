import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { StackStatistics } from '../../models';
import { BaseChartDirective } from 'ng2-charts';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
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
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

@Component({
  selector: 'app-stack-statistics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, TranslateModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StackStatisticsComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  @Input() stackId!: string;
  
  stats = signal<StackStatistics | null>(null);
  loading = signal(false);
  isInitialized = false;
  highlightedCardId = signal<string | null>(null);

  // Chart Options
  createBarChartOptions(chartType: 'mostReviewed' | 'hardestCards' | 'easiestCards'): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          this.scrollToCard(index, chartType);
        }
      },
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
          padding: 12,
          callbacks: {
            afterLabel: () => {
              return this.translate.instant('stats.charts.tooltip_hint');
            }
          }
        }
      }
    };
  }

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

  mostReviewedChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  hardestCardsChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  easiestCardsChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  boxDistributionChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  activityChartData: ChartData<'line'> = { labels: [], datasets: [] };

  // Chart-spezifische Options
  mostReviewedChartOptions!: ChartConfiguration['options'];
  hardestCardsChartOptions!: ChartConfiguration['options'];
  easiestCardsChartOptions!: ChartConfiguration['options'];

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
      ArcElement,
      Tooltip,
      Legend
    );
  }

  ngOnInit() {
    // Nur laden wenn stackId vorhanden
    if (this.stackId && !this.isInitialized) {
      this.loadStatistics();
      this.isInitialized = true;
    }

    // Chart-spezifische Options initialisieren
    this.mostReviewedChartOptions = this.createBarChartOptions('mostReviewed');
    this.hardestCardsChartOptions = this.createBarChartOptions('hardestCards');
    this.easiestCardsChartOptions = this.createBarChartOptions('easiestCards');
  }

  loadStatistics() {
    if (!this.stackId) return;
    
    this.loading.set(true);
    this.api.getStackStatistics(this.stackId).subscribe({
      next: stats => {
        this.stats.set(stats);
        this.setupCharts();
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading statistics:', err);
        this.loading.set(false);
      }
    });
  }

  private truncate(text: string, max = 18): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  setupCharts() {
    const s = this.stats();
    if (!s) return;

    // Most Reviewed
    this.mostReviewedChartData = {
      labels: s.mostReviewed.map(c => this.truncate(c.front)),
      datasets: [{
        data: s.mostReviewed.map(c => c.review_count ?? 0),
        backgroundColor: '#4dd5ff',
        hoverBackgroundColor: '#6ee0ff',
        borderRadius: 6
      }]
    };

    // Hardest Cards
    this.hardestCardsChartData = {
      labels: s.hardestCards.map(c => this.truncate(c.front)),
      datasets: [{
        data: s.hardestCards.map(c => c.hard_count ?? 0),
        backgroundColor: '#f87171',
        hoverBackgroundColor: '#fca5a5',
        borderRadius: 6
      }]
    };

    // Easiest Cards
    this.easiestCardsChartData = {
      labels: s.easiestCards.map(c => this.truncate(c.front)),
      datasets: [{
        data: s.easiestCards.map(c => c.easy_count ?? 0),
        backgroundColor: '#4ade80',
        hoverBackgroundColor: '#6ee7b7',
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
    const recentDays = s.recentActivity.slice(-14);
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
  }

  get accuracyRate(): number {
    const s = this.stats();
    if (!s) return 0;
    
    const total = s.overall.total_reviews;
    if (total === 0) return 0;
    
    const correct = s.overall.total_good + s.overall.total_easy;
    return Math.round((correct / total) * 100);
  }

  get difficultyRate(): number {
    const s = this.stats();
    if (!s) return 0;
    
    const total = s.overall.total_reviews;
    if (total === 0) return 0;
    
    const difficult = s.overall.total_again + s.overall.total_hard;
    return Math.round((difficult / total) * 100);
  }

  scrollToCard(index: number, chartType?: 'mostReviewed' | 'hardestCards' | 'easiestCards') {
    const s = this.stats();
    if (!s) return;

    let cardId: string | undefined;
    
    // Bestimme die Karte basierend auf dem Chart-Typ
    if (chartType === 'mostReviewed') {
      cardId = s.mostReviewed[index]?.id;
    } else if (chartType === 'hardestCards') {
      cardId = s.hardestCards[index]?.id;
    } else if (chartType === 'easiestCards') {
      cardId = s.easiestCards[index]?.id;
    }

    if (!cardId) return;

    // Highlight setzen
    this.highlightedCardId.set(cardId);

    // Scroll zur Karte
    setTimeout(() => {
      const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Highlight nach 3 Sekunden entfernen
    setTimeout(() => {
      this.highlightedCardId.set(null);
    }, 3000);
  }
}