export const runtime = 'nodejs'

import React, { useState } from 'react';
import { Upload, Download, Server, AlertCircle, CheckCircle, Eye, EyeOff, Clock, UserCheck } from 'lucide-react';

export default function SSHFileTransfer({ 
  environment, 
  timeOccurred, 
  beforeMinutes = 2,
  afterMinutes = 1,
  onTransferSuccess, 
  onTransferError, 
  onSkipTransfer 
}) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [transferAttempts, setTransferAttempts] = useState(0);

  // Check if SSH is available for this environment
  const isSSHAvailable = environment && (environment.host || environment.sshHost);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const formatTimeRange = (issueTime) => {
    const issueDate = new Date(issueTime);
    const startTime = new Date(issueDate.getTime() - (beforeMinutes * 60 * 1000)); // Custom minutes before
    const endTime = new Date(issueDate.getTime() + (afterMinutes * 60 * 1000)); // Custom minutes after

    // Format using exact time
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      display: `${startTime.toLocaleString('en-US', options)} to ${endTime.toLocaleString('en-US', options)}`
    };
  };

  const handleTransfer = async () => {
    if (!credentials.username || !credentials.password) {
      setError('Please provide both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const timeRange = formatTimeRange(timeOccurred);
      
      const response = await fetch('/api/ssh-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          environment,
          timeRange,
          beforeMinutes,
          afterMinutes,
          sessionId: `ssh_session_${Date.now()}_${environment.envId || environment}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        onTransferSuccess(data);
      } else {
        setTransferAttempts(prev => prev + 1);
        setError(data.error || 'Transfer failed');
        
        if (data.authenticationFailed) {
          setError('Authentication failed. Please check your username and password and try again.');
        }
      }
    } catch (err) {
      setTransferAttempts(prev => prev + 1);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkipTransfer();
  };

  const timeRange = formatTimeRange(timeOccurred);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border">
      <div className="flex items-center gap-3 mb-6">
        <Server className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Retrieve Log Files</h2>
          <p className="text-gray-600 text-sm">SSH into {environment.name || environment} to fetch log files</p>
        </div>
      </div>

      {/* Environment and Time Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Environment:</span>
            <p className="text-gray-900">{environment.name || environment}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Host:</span>
            <p className="text-gray-900 font-mono">{environment.host}</p>
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700">Remote File Path:</span>
            <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded mt-1">
              /var/log/swms.log
            </p>
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Time Range:
            </span>
            <p className="text-gray-900">{timeRange.display}</p>
            <p className="text-xs text-gray-500 mt-1">
              {beforeMinutes} minutes before issue time to {afterMinutes} minutes after
            </p>
          </div>
        </div>
      </div>

      {/* SSH Availability Check */}
      {!isSSHAvailable && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-yellow-800 font-medium text-sm">SSH Not Configured</h4>
              <p className="text-yellow-700 text-sm mt-1">
                This environment doesn&apos;t have SSH host information configured. You can skip this step and continue with database logs only.
              </p>
              <button
                onClick={handleSkip}
                className="mt-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded"
              >
                Continue without SSH logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Form */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserCheck className="w-4 h-4 inline mr-1" />
              SSH Username
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Your SSH username"
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading || !isSSHAvailable}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SSH Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="Your SSH password"
                className="w-full text-black px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading || !isSSHAvailable}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading || !isSSHAvailable}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleTransfer}
            disabled={loading || !isSSHAvailable || !credentials.username || !credentials.password}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Download size={20} />
            )}
            {loading ? 'Connecting...' : isSSHAvailable ? 'Retrieve Log Files' : 'SSH Not Available'}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip & Continue
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-red-800 font-medium">
              {transferAttempts > 0 ? 'Transfer Failed' : 'Error'}
            </h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            {transferAttempts > 0 && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-red-700 text-sm mb-2">
                  You can try again with correct credentials or continue without log files.
                </p>
                <button
                  onClick={handleSkip}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                >
                  Continue without log files
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-blue-800 font-medium text-sm">SSH Connection Details</h4>
            <p className="text-blue-700 text-sm mt-1">
              This will connect to <strong>{environment.host || 'the selected environment'}</strong> and download 
              the log file <strong>/var/log/swms.log</strong> for the specified time range ({beforeMinutes} minutes before to {afterMinutes} minutes after the issue time). 
              If you don&apos;t have SSH access, you can skip this step and continue with database logs only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
