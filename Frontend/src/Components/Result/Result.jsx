import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Result.css";

function Result() {
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem("modelResults");
    if (data) {
      setResults(JSON.parse(data));
    }
  }, []);

  if (!results) {
    return (
      <div className="result-page">
        <h2>No results found</h2>
        <p>Please upload a CT scan first.</p>
      </div>
    );
  }

  return (
    <div className="result-page">
      <h1>Lung Cancer Prediction Results</h1>
      <p>AI model confidence scores</p>

      {/* FINAL CASE */}
      {results.final_case && (
        <h2 className="final-case">
          Final Diagnosis: <span>{results.final_case}</span>
        </h2>
      )}

      <table className="result-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Prediction</th>
            <th>Confidence (%)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(results)
            .filter(([key]) => key !== "final_case")
            .map(([model, value]) => (
              <tr key={model}>
                <td>{model}</td>
                <td>{value.case}</td>
                <td>{value.confidence.toFixed(2)}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* BUTTONS ROW */}
      <div className="action-buttons">
        <button
          className="back-btn"
          onClick={() => window.history.back()}
        >
          Upload Another Image
        </button>

        <button
          className="save-btn"
          onClick={() => navigate("/save-report")}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default Result;
