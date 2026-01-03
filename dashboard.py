# dashboard.py
"""Dashboard visualization generator for Agrarian BNPL analytics.

Creates 3 key charts:
1. Late payment probability distribution (histogram with risk tier shading)
2. Farm size vs late payment probability (scatter by farm type)
3. Recommended product distribution (bar chart)

Outputs high-resolution PNG for executive reporting.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for PNG export

from generator import generate_synthetic_agrarian_data
from scoring_engine import compute_linear_risk_score, sigmoid_pd_mapping
from product_matcher import match_product

np.random.seed(42)


def generate_dashboard_data(n_samples=1000):
    """Generate scored dataset with all features for dashboard.

    Args:
        n_samples: Number of synthetic samples to generate

    Returns:
        pandas.DataFrame with risk scores and product recommendations
    """
    df = generate_synthetic_agrarian_data(n_samples)

    # Compute scores for all applicants
    linear_scores = []
    late_probs = []
    recommended_products = []

    for idx, row in df.iterrows():
        linear_score = compute_linear_risk_score(row)
        late_prob = sigmoid_pd_mapping(linear_score)
        top_1, _ = match_product(row)

        linear_scores.append(linear_score)
        late_probs.append(late_prob)
        recommended_products.append(top_1)

    df['linear_risk_score'] = linear_scores
    df['late_payment_prob'] = late_probs
    df['recommended_product'] = recommended_products

    return df


def create_dashboard_charts(df, output_dir='charts'):
    """Create 3 dashboard charts and save as separate PNG files.

    Args:
        df: DataFrame with scored applicants
        output_dir: Directory to save PNG files (default 'charts')

    Returns:
        list: Paths to saved PNG files
    """
    import os

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    plt.style.use('seaborn-v0_8-darkgrid')
    output_paths = []

    # ===== Chart 1: Late Payment Probability Distribution =====
    fig1, ax1 = plt.subplots(figsize=(10, 7))

    # Histogram with risk tier color coding
    n, bins, patches = ax1.hist(df['late_payment_prob'], bins=40,
                                  edgecolor='black', alpha=0.7, color='steelblue')

    # Color code by risk tier
    for i, patch in enumerate(patches):
        bin_center = (bins[i] + bins[i+1]) / 2
        if bin_center < 0.15:
            patch.set_facecolor('#2ecc71')  # Green (Low)
        elif bin_center < 0.35:
            patch.set_facecolor('#f39c12')  # Orange (Medium)
        elif bin_center < 0.50:
            patch.set_facecolor('#e74c3c')  # Red (High)
        else:
            patch.set_facecolor('#95a5a6')  # Gray (Decline)

    # Vertical threshold lines
    ax1.axvline(0.15, color='black', linestyle='--', linewidth=1.5,
                label='Low/Med (15%)')
    ax1.axvline(0.35, color='black', linestyle='--', linewidth=1.5,
                label='Med/High (35%)')
    ax1.axvline(0.50, color='darkred', linestyle='--', linewidth=2,
                label='Decline (50%)')

    ax1.set_xlabel('Late Payment Probability', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Count', fontsize=12, fontweight='bold')
    ax1.set_title('Late Payment Probability Distribution\n(n=1000 synthetic applicants)',
                  fontsize=14, fontweight='bold', pad=20)

    # Position legend in upper left to avoid overlap
    ax1.legend(loc='upper left', fontsize=10, framealpha=0.95,
               edgecolor='black', fancybox=True)
    ax1.grid(True, alpha=0.3)

    # Add summary stats box in upper right (with padding)
    mean_pd = df['late_payment_prob'].mean()
    median_pd = df['late_payment_prob'].median()
    stats_text = f'Mean: {mean_pd:.1%}\nMedian: {median_pd:.1%}\nStd: {df["late_payment_prob"].std():.1%}'
    ax1.text(0.97, 0.97, stats_text,
             transform=ax1.transAxes, fontsize=11, verticalalignment='top',
             horizontalalignment='right',
             bbox=dict(boxstyle='round,pad=0.8', facecolor='lightblue',
                      edgecolor='black', alpha=0.85, linewidth=1.5))

    # Save Chart 1
    chart1_path = f'{output_dir}/01_late_payment_probability_distribution.png'
    plt.tight_layout()
    fig1.savefig(chart1_path, dpi=300, bbox_inches='tight')
    output_paths.append(chart1_path)
    plt.close(fig1)
    print(f"✓ Chart 1 saved: {chart1_path}")

    # ===== Chart 2: Farm Size vs Late Payment Probability (Scatter) =====
    fig2, ax2 = plt.subplots(figsize=(10, 7))

    # Color by farm type
    farm_type_colors = {
        'smallholder': '#e74c3c',
        'commercial': '#2ecc71',
        'cooperative': '#3498db'
    }

    for farm_type, color in farm_type_colors.items():
        mask = df['farm_type'] == farm_type
        ax2.scatter(df[mask]['farm_size_ha'], df[mask]['late_payment_prob'],
                    c=color, label=farm_type.capitalize(), alpha=0.6, s=30,
                    edgecolors='black', linewidth=0.3)

    # Horizontal threshold lines
    ax2.axhline(0.15, color='gray', linestyle='--', linewidth=1, alpha=0.7)
    ax2.axhline(0.35, color='orange', linestyle='--', linewidth=1, alpha=0.7)
    ax2.axhline(0.50, color='darkred', linestyle='--', linewidth=1.5, alpha=0.7)

    ax2.set_xlabel('Farm Size (hectares, log scale)', fontsize=11, fontweight='bold')
    ax2.set_ylabel('Late Payment Probability', fontsize=11, fontweight='bold')
    ax2.set_title('Farm Size vs Payment Risk\n(colored by farm type)',
                  fontsize=12, fontweight='bold')
    ax2.set_xscale('log')
    ax2.legend(loc='upper right', fontsize=9, framealpha=0.9)
    ax2.grid(True, alpha=0.3)
    ax2.set_xlim(0.5, 500)
    ax2.set_ylim(-0.05, 1.05)

    # Save Chart 2
    chart2_path = f'{output_dir}/02_farm_size_vs_payment_risk.png'
    plt.tight_layout()
    fig2.savefig(chart2_path, dpi=300, bbox_inches='tight')
    output_paths.append(chart2_path)
    plt.close(fig2)
    print(f"✓ Chart 2 saved: {chart2_path}")

    # ===== Chart 3: Recommended Product Counts (Bar) =====
    fig3, ax3 = plt.subplots(figsize=(10, 7))

    product_counts = df['recommended_product'].value_counts().sort_values(ascending=True)

    bars = ax3.barh(product_counts.index, product_counts.values,
                     color='#3498db', edgecolor='black', linewidth=1.2)

    # Color bars by product type
    product_colors = {
        'Seeds_BNPL': '#2ecc71',
        'Fertilizer_BNPL': '#27ae60',
        'Equipment_Lease': '#e67e22',
        'Input_Bundle': '#9b59b6',
        'Cash_Advance': '#f39c12',
        'Premium_BNPL': '#34495e'
    }

    for bar, product in zip(bars, product_counts.index):
        bar.set_color(product_colors.get(product, '#95a5a6'))

    # Add count labels
    for i, (product, count) in enumerate(product_counts.items()):
        ax3.text(count + 5, i, f'{count} ({count/len(df)*100:.1f}%)',
                 va='center', fontsize=9, fontweight='bold')

    ax3.set_xlabel('Number of Applicants', fontsize=11, fontweight='bold')
    ax3.set_ylabel('Product', fontsize=11, fontweight='bold')
    ax3.set_title('Recommended Product Distribution\n(top-1 matches)',
                  fontsize=12, fontweight='bold')
    ax3.grid(True, axis='x', alpha=0.3)

    # Save Chart 3
    chart3_path = f'{output_dir}/03_product_distribution.png'
    plt.tight_layout()
    fig3.savefig(chart3_path, dpi=300, bbox_inches='tight')
    output_paths.append(chart3_path)
    plt.close(fig3)
    print(f"✓ Chart 3 saved: {chart3_path}")

    return output_paths


def print_dashboard_summary(df):
    """Print summary statistics for dashboard context.

    Args:
        df: DataFrame with scored applicants
    """
    print("\n" + "="*70)
    print("DASHBOARD SUMMARY STATISTICS (n=1000 synthetic applicants)")
    print("="*70)

    # Risk tier distribution
    risk_tiers = pd.cut(df['late_payment_prob'],
                        bins=[0, 0.15, 0.35, 0.50, 1.0],
                        labels=['Low', 'Medium', 'High', 'Decline'])
    print("\nRisk Tier Distribution:")
    print(risk_tiers.value_counts().sort_index())

    # Product distribution
    print("\nProduct Recommendations:")
    print(df['recommended_product'].value_counts())

    # Farm type stats
    print("\nAverage Late Payment Prob by Farm Type:")
    print(df.groupby('farm_type')['late_payment_prob'].mean().sort_values(ascending=False))

    # Region stats
    print("\nAverage Late Payment Prob by Region:")
    print(df.groupby('region')['late_payment_prob'].mean().sort_values(ascending=False))

    print("\nOverall Statistics:")
    print(f"  Mean Late Payment Prob: {df['late_payment_prob'].mean():.2%}")
    print(f"  Median Late Payment Prob: {df['late_payment_prob'].median():.2%}")
    print(f"  Approval Rate (PD < 50%): {(df['late_payment_prob'] < 0.50).mean():.1%}")
    print(f"  Auto-Approve Rate (PD < 15%): {(df['late_payment_prob'] < 0.15).mean():.1%}")
    print("="*70 + "\n")


if __name__ == "__main__":
    # Generate data
    print("Generating synthetic scored dataset...")
    df = generate_dashboard_data(1000)

    # Print summary
    print_dashboard_summary(df)

    # Create charts
    print("\nCreating dashboard charts...")
    output_paths = create_dashboard_charts(df, output_dir='charts')

    print(f"\n✓ Dashboard generation complete!")
    print(f"  • Output directory: charts/")
    print(f"  • Charts created: {len(output_paths)}")
    for i, path in enumerate(output_paths, 1):
        print(f"    {i}. {path}")
    print(f"  • Resolution: 300 DPI")
    print(f"  • Format: PNG (high quality)")
