
import React from 'react';
import { LabReportData, LabResultStatus } from '../types';
import { FoodIcon, LifestyleIcon, CheckCircleIcon } from './IconComponents';

interface LabReportResultProps {
  data: LabReportData;
}

const getStatusStyles = (status: LabResultStatus) => {
    switch(status) {
        case LabResultStatus.NORMAL: return {
            chip: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/50',
            border: 'border-green-500',
            icon: 'text-green-500'
        };
        case LabResultStatus.SLIGHTLY_HIGH:
        case LabResultStatus.SLIGHTLY_LOW:
            return {
                chip: 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/50',
                border: 'border-yellow-500',
                icon: 'text-yellow-500'
            };
        case LabResultStatus.HIGH:
        case LabResultStatus.LOW:
            return {
                chip: 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/50',
                border: 'border-orange-500',
                icon: 'text-orange-500'
            };
        case LabResultStatus.VERY_HIGH:
        case LabResultStatus.VERY_LOW:
            return {
                chip: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/50',
                border: 'border-red-500',
                icon: 'text-red-500'
            };
        default: return {
            chip: 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700',
            border: 'border-gray-500',
            icon: 'text-gray-500'
        };
    }
}

const LabReportResult: React.FC<LabReportResultProps> = ({ data }) => {
    const abnormalResultsCount = data.results.filter(r => r.status !== LabResultStatus.NORMAL).length;

    return (
        <div className="w-full max-w-5xl mx-auto mt-8 p-4 sm:p-6 bg-transparent animate-fade-in space-y-8">
            <h2 className="text-3xl font-bold text-secondary dark:text-darkHeading text-center">Lab Report Analysis</h2>

            {/* Summary Card */}
            <div className="bg-surface dark:bg-darkSurface p-5 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold text-primary-dark mb-3">Report Summary</h3>
                <p className="text-gray-600 dark:text-slate-300">
                    {abnormalResultsCount > 0
                        ? `Your lab report shows ${abnormalResultsCount} result(s) outside the normal range. See the details and recommendations below.`
                        : "All your lab results are within the normal range. Great job!"}
                </p>
            </div>

            {/* Results Section */}
            <div>
                <h3 className="text-2xl font-semibold text-secondary dark:text-darkHeading mb-4">Detailed Results</h3>
                <div className="space-y-4">
                    {data.results.map((result, index) => {
                        const styles = getStatusStyles(result.status);
                        return (
                            <div key={index} className={`bg-surface dark:bg-darkSurface rounded-lg shadow border-l-4 ${styles.border} overflow-hidden transition-all hover:shadow-xl`}>
                                <div className="p-4">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                        <div className="flex-1">
                                            <p className="font-bold text-lg text-primary">{result.testName}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{result.interpretation}</p>
                                        </div>
                                        <div className="flex-shrink-0 mt-2 sm:mt-0 sm:text-right">
                                            <p className="text-xl font-semibold text-secondary dark:text-darkHeading">{result.value} <span className="text-sm font-normal text-gray-500 dark:text-slate-400">{result.unit}</span></p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">Range: {result.referenceRange}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles.chip}`}>
                                            {result.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recommendations Section */}
             {(data.recommendations.food.length > 0 || data.recommendations.lifestyle.length > 0) && (
                <div>
                    <h3 className="text-2xl font-semibold text-secondary dark:text-darkHeading mb-4">Personalized Recommendations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.recommendations.food.length > 0 && (
                            <div className="bg-surface dark:bg-darkSurface p-5 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                                <h4 className="flex items-center text-lg font-semibold text-primary-dark mb-3">
                                    <FoodIcon className="mr-2"/>
                                    Food Recommendations
                                </h4>
                                <ul className="space-y-2">
                                {data.recommendations.food.map((item, index) => (
                                    <li key={index} className="flex items-start text-gray-700 dark:text-slate-300">
                                        <CheckCircleIcon className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        )}
                        {data.recommendations.lifestyle.length > 0 && (
                             <div className="bg-surface dark:bg-darkSurface p-5 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                                <h4 className="flex items-center text-lg font-semibold text-accent mb-3">
                                    <LifestyleIcon className="mr-2"/>
                                    Lifestyle Recommendations
                                </h4>
                                <ul className="space-y-2">
                                {data.recommendations.lifestyle.map((item, index) => (
                                    <li key={index} className="flex items-start text-gray-700 dark:text-slate-300">
                                        <CheckCircleIcon className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
             )}
        </div>
    );
};

export default LabReportResult;