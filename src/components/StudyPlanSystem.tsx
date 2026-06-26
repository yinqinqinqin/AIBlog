import { Check, Plus, Save, Target, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { StudyPlanSystem as StudyPlanSystemData } from "@/data/blog";
import { useStudyPlanStore } from "@/store/studyPlanStore";

type StudyPlanSystemProps = {
  plan: StudyPlanSystemData;
};

export default function StudyPlanSystem({ plan }: StudyPlanSystemProps) {
  const {
    activePhaseId,
    activeTrackId,
    completedTaskIds,
    customPlans,
    selectedPlanId,
    setActivePhaseId,
    setActiveTrackId,
    toggleTask,
    selectPlan,
    createPlan,
    updatePlan,
    deletePlan,
    addPlanTask,
    updatePlanTask,
    togglePlanTask,
    deletePlanTask,
  } = useStudyPlanStore();

  const activePhase = plan.phases.find((phase) => phase.id === activePhaseId) ?? plan.phases[0];
  const activeTrack = plan.tracks.find((track) => track.id === activeTrackId) ?? plan.tracks[0];
  const activePhaseCompletedCount = activePhase.milestones.filter((milestone) => completedTaskIds.includes(milestone.id)).length;
  const selectedPlan = customPlans.find((item) => item.id === selectedPlanId) ?? null;
  const selectedTrack = plan.tracks.find((track) => track.id === selectedPlan?.trackId) ?? activeTrack;
  const selectedPhase = plan.phases.find((phase) => phase.id === selectedPlan?.phaseId) ?? activePhase;
  const selectedPlanCompletedCount = selectedPlan?.tasks.filter((task) => task.completed).length ?? 0;
  const selectedPlanTaskCount = selectedPlan?.tasks.length ?? 0;
  const selectedPlanProgress =
    selectedPlanTaskCount > 0 ? Math.round((selectedPlanCompletedCount / selectedPlanTaskCount) * 100) : 0;

  const templateDraft = useMemo(
    () => ({
      title: "",
      trackId: activeTrack.id,
      phaseId: activePhase.id,
      duration: activePhase.duration,
      goal: activePhase.goal,
    }),
    [activePhase.duration, activePhase.goal, activePhase.id, activeTrack.id],
  );

  const [planTitle, setPlanTitle] = useState(templateDraft.title);
  const [planTrackId, setPlanTrackId] = useState(templateDraft.trackId);
  const [planPhaseId, setPlanPhaseId] = useState(templateDraft.phaseId);
  const [planDuration, setPlanDuration] = useState(templateDraft.duration);
  const [planGoal, setPlanGoal] = useState(templateDraft.goal);
  const [newTaskLabel, setNewTaskLabel] = useState("");

  useEffect(() => {
    if (selectedPlan) {
      setPlanTitle(selectedPlan.title);
      setPlanTrackId(selectedPlan.trackId);
      setPlanPhaseId(selectedPlan.phaseId);
      setPlanDuration(selectedPlan.duration);
      setPlanGoal(selectedPlan.goal);
      setActiveTrackId(selectedPlan.trackId);
      setActivePhaseId(selectedPlan.phaseId);
      return;
    }

    setPlanTitle(templateDraft.title);
    setPlanTrackId(templateDraft.trackId);
    setPlanPhaseId(templateDraft.phaseId);
    setPlanDuration(templateDraft.duration);
    setPlanGoal(templateDraft.goal);
  }, [selectedPlan, setActivePhaseId, setActiveTrackId, templateDraft]);

  function handleTrackSelect(trackId: string) {
    setPlanTrackId(trackId);
    setActiveTrackId(trackId);
  }

  function handlePhaseSelect(phaseId: string) {
    const phase = plan.phases.find((item) => item.id === phaseId) ?? plan.phases[0];

    setPlanPhaseId(phase.id);
    setPlanDuration(phase.duration);
    if (!selectedPlan || planGoal === selectedPhase.goal) {
      setPlanGoal(phase.goal);
    }
    setActivePhaseId(phase.id);
  }

  function handleCreatePlan() {
    const phase = plan.phases.find((item) => item.id === planPhaseId) ?? activePhase;
    const normalizedTitle = planTitle.trim() || `${selectedTrack.title} 计划`;

    createPlan({
      title: normalizedTitle,
      trackId: planTrackId,
      phaseId: planPhaseId,
      duration: planDuration.trim() || phase.duration,
      goal: planGoal.trim() || phase.goal,
      tasks: phase.milestones.map((milestone) => milestone.label),
    });
  }

  function handleUpdatePlan() {
    if (!selectedPlan) {
      return;
    }

    updatePlan(selectedPlan.id, {
      title: planTitle.trim() || selectedPlan.title,
      trackId: planTrackId,
      phaseId: planPhaseId,
      duration: planDuration.trim() || selectedPlan.duration,
      goal: planGoal.trim() || selectedPlan.goal,
    });
  }

  function handleDeletePlan() {
    if (!selectedPlan) {
      return;
    }

    deletePlan(selectedPlan.id);
  }

  function handleAddTask() {
    if (!selectedPlan || !newTaskLabel.trim()) {
      return;
    }

    addPlanTask(selectedPlan.id, newTaskLabel);
    setNewTaskLabel("");
  }

  return (
    <section className="study-plan-system">
      <section className="study-plan-system__workspace">
        <div className="study-plan-system__workspace-layout">
          <aside className="study-plan-system__workspace-nav">
            <div className="study-plan-system__workspace-group">
              <div className="study-plan-system__workspace-label">计划设置</div>
              <div className="study-plan-system__editor">
                <label className="study-plan-system__field">
                  <span>计划名称</span>
                  <input
                    onChange={(event) => setPlanTitle(event.target.value)}
                    placeholder="例如：7 月材质专项计划"
                    type="text"
                    value={planTitle}
                  />
                </label>

                <label className="study-plan-system__field">
                  <span>计划周期</span>
                  <input
                    onChange={(event) => setPlanDuration(event.target.value)}
                    placeholder="例如：4 周"
                    type="text"
                    value={planDuration}
                  />
                </label>

                <label className="study-plan-system__field">
                  <span>阶段目标</span>
                  <textarea
                    onChange={(event) => setPlanGoal(event.target.value)}
                    placeholder="写下当前计划的目标"
                    rows={4}
                    value={planGoal}
                  />
                </label>

                <div className="study-plan-system__editor-actions">
                  <button className="is-primary" onClick={handleCreatePlan} type="button">
                    <Plus size={16} />
                    <span>新增计划</span>
                  </button>
                  <button disabled={!selectedPlan} onClick={handleUpdatePlan} type="button">
                    <Save size={16} />
                    <span>保存修改</span>
                  </button>
                  <button className="is-danger" disabled={!selectedPlan} onClick={handleDeletePlan} type="button">
                    <Trash2 size={16} />
                    <span>删除计划</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="study-plan-system__workspace-group">
              <div className="study-plan-system__workspace-label">主线模板</div>
              <div className="study-plan-system__track-tabs">
                {plan.tracks.map((track) => (
                  <button
                    className={track.id === planTrackId ? "is-active" : ""}
                    key={track.id}
                    onClick={() => handleTrackSelect(track.id)}
                    type="button"
                  >
                    <span>{track.title}</span>
                    <p>{track.summary}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="study-plan-system__workspace-group">
              <div className="study-plan-system__workspace-label">阶段模板</div>
              <div className="study-plan-system__phase-switcher">
                {plan.phases.map((phase) => (
                  <button
                    className={phase.id === planPhaseId ? "is-active" : ""}
                    key={phase.id}
                    onClick={() => handlePhaseSelect(phase.id)}
                    type="button"
                  >
                    <span>{phase.phase}</span>
                    <strong>{phase.duration}</strong>
                    <p>
                      {phase.milestones.filter((milestone) => completedTaskIds.includes(milestone.id)).length} / {phase.milestones.length} 已完成
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="study-plan-system__workspace-group">
              <div className="study-plan-system__workspace-label">计划列表</div>
              <div className="study-plan-system__saved-list">
                {customPlans.length > 0 ? (
                  customPlans.map((item) => (
                    <button
                      className={item.id === selectedPlanId ? "is-active" : ""}
                      key={item.id}
                      onClick={() => selectPlan(item.id)}
                      type="button"
                    >
                      <strong>{item.title}</strong>
                      <span>{item.duration}</span>
                    </button>
                  ))
                ) : (
                  <div className="study-plan-system__empty">先在上面填写内容，再新增第一条计划。</div>
                )}
              </div>
            </div>
          </aside>

          <div className="study-plan-system__workspace-main">
            {selectedPlan ? (
              <article className="study-plan-system__phase is-active">
                <div className="study-plan-system__phase-meta">
                  <span>{selectedTrack.title}</span>
                  <strong>{selectedPhase.phase}</strong>
                </div>

                <h3>{selectedPlan.title}</h3>
                <p className="study-plan-system__phase-goal">{selectedPlan.goal}</p>

                <div className="study-plan-system__phase-progress">
                  <div className="study-plan-system__progress-head">
                    <span>计划进度</span>
                    <strong>
                      {selectedPlanCompletedCount} / {selectedPlanTaskCount}
                    </strong>
                  </div>
                  <div className="study-plan-system__progress-bar" aria-hidden="true">
                    <span
                      style={{
                        width: `${selectedPlanProgress}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="study-plan-system__checklist">
                  {selectedPlan.tasks.map((task) => (
                    <div className={`study-plan-system__checkitem ${task.completed ? "is-checked" : ""}`} key={task.id}>
                      <button
                        className="study-plan-system__checktoggle"
                        onClick={() => togglePlanTask(selectedPlan.id, task.id)}
                        type="button"
                      >
                        <span className="study-plan-system__checkicon" aria-hidden="true">
                          {task.completed ? <Check size={16} /> : <Target size={16} />}
                        </span>
                      </button>
                      <input
                        aria-label="计划任务"
                        className="study-plan-system__task-input"
                        onChange={(event) => updatePlanTask(selectedPlan.id, task.id, event.target.value)}
                        type="text"
                        value={task.label}
                      />
                      <button
                        className="study-plan-system__task-delete"
                        onClick={() => deletePlanTask(selectedPlan.id, task.id)}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="study-plan-system__task-creator">
                  <input
                    onChange={(event) => setNewTaskLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddTask();
                      }
                    }}
                    placeholder="添加新的计划任务"
                    type="text"
                    value={newTaskLabel}
                  />
                  <button onClick={handleAddTask} type="button">
                    <Plus size={16} />
                    <span>添加任务</span>
                  </button>
                </div>

                <div className="study-plan-system__phase-summary">
                  <span>当前周期</span>
                  <strong>{selectedPlan.duration}</strong>
                </div>
              </article>
            ) : (
              <article className="study-plan-system__phase is-empty">
                <div className="study-plan-system__phase-meta">
                  <span>{activeTrack.title}</span>
                  <strong>{activePhase.phase}</strong>
                </div>
                <h3>{activePhase.goal}</h3>
                <p className="study-plan-system__phase-goal">
                  先在左侧填写计划名称和目标，然后点击“新增计划”，右侧就会生成可编辑、可勾选、可删除的任务进度。
                </p>
                <div className="study-plan-system__phase-progress">
                  <div className="study-plan-system__progress-head">
                    <span>模板参考进度</span>
                    <strong>
                      {activePhaseCompletedCount} / {activePhase.milestones.length}
                    </strong>
                  </div>
                  <div className="study-plan-system__progress-bar" aria-hidden="true">
                    <span
                      style={{
                        width: `${activePhase.milestones.length > 0 ? (activePhaseCompletedCount / activePhase.milestones.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="study-plan-system__checklist">
                  {activePhase.milestones.map((milestone) => {
                    const checked = completedTaskIds.includes(milestone.id);

                    return (
                      <button
                        className={`study-plan-system__checkitem ${checked ? "is-checked" : ""}`}
                        key={milestone.id}
                        onClick={() => toggleTask(milestone.id)}
                        type="button"
                      >
                        <span className="study-plan-system__checkicon" aria-hidden="true">
                          {checked ? <Check size={16} /> : <Target size={16} />}
                        </span>
                        <span>{milestone.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="study-plan-system__phase-summary">
                  <span>当前模板周期</span>
                  <strong>{activePhase.duration}</strong>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
