import { CheckCircle2, Circle, Clock, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { StudyPlanSystem as StudyPlanSystemData } from "@/data/blog";
import type { StudyTaskStatus } from "@/store/studyPlanStore";
import { useStudyPlanStore } from "@/store/studyPlanStore";

type StudyPlanSystemProps = {
  plan: StudyPlanSystemData;
};

const statusOptions: Array<{ value: StudyTaskStatus; label: string }> = [
  { value: "todo", label: "未完成" },
  { value: "doing", label: "进行中" },
  { value: "done", label: "已完成" },
];

const filterOptions: Array<{ value: "all" | StudyTaskStatus; label: string; icon: typeof Circle }> = [
  { value: "all", label: "全部", icon: Circle },
  { value: "todo", label: "未完成", icon: Circle },
  { value: "doing", label: "进行中", icon: Clock },
  { value: "done", label: "已完成", icon: CheckCircle2 },
];

function getStatusLabel(status: StudyTaskStatus) {
  return statusOptions.find((item) => item.value === status)?.label ?? "未完成";
}

export default function StudyPlanSystem({ plan: _plan }: StudyPlanSystemProps) {
  const { tasks, selectedTaskId, selectTask, createTask, updateTask, deleteTask } = useStudyPlanStore();
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const [taskTitle, setTaskTitle] = useState("");
  const [taskStatus, setTaskStatus] = useState<StudyTaskStatus>("todo");
  const [activeFilter, setActiveFilter] = useState<"all" | StudyTaskStatus>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const statusCounts = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo").length,
      doing: tasks.filter((task) => task.status === "doing").length,
      done: tasks.filter((task) => task.status === "done").length,
    }),
    [tasks],
  );

  const filteredTasks = useMemo(
    () => tasks.filter((task) => (activeFilter === "all" ? true : task.status === activeFilter)),
    [activeFilter, tasks],
  );

  useEffect(() => {
    if (selectedTask) {
      setTaskTitle(selectedTask.title);
      setTaskStatus(selectedTask.status);
      setIsFormOpen(true);
      return;
    }

    setTaskTitle("");
    setTaskStatus("todo");
    setIsFormOpen(false);
  }, [selectedTask]);

  function handleCreateTask() {
    const normalizedTitle = taskTitle.trim();
    if (!normalizedTitle) {
      return;
    }

    createTask({
      title: normalizedTitle,
      status: taskStatus,
    });
    setActiveFilter("all");
  }

  function handleUpdateTask() {
    if (!selectedTask || !taskTitle.trim()) {
      return;
    }

    updateTask(selectedTask.id, {
      title: taskTitle.trim(),
      status: taskStatus,
    });
  }

  function handleDeleteTask() {
    if (!selectedTask) {
      return;
    }

    deleteTask(selectedTask.id);
  }

  function handleStartCreate() {
    selectTask(null);
    setTaskTitle("");
    setTaskStatus("todo");
    setIsFormOpen((current) => !current || Boolean(selectedTask));
  }

  function handleEditTask(taskId: string) {
    selectTask(taskId);
    setIsFormOpen(true);
  }

  return (
    <section className="study-plan-system">
      <section className="study-plan-system__workspace study-plan-system__workspace--reference">
        <div className="study-plan-system__hero">
          <h2>任务管理</h2>
          <p>只保留任务本身，统一用未完成、进行中、已完成三种状态管理，并支持直接增删改查。</p>
        </div>

        <div className="study-plan-system__status-grid study-plan-system__status-grid--overview">
          <div className="study-plan-system__status-card">
            <span>总任务</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="study-plan-system__status-card study-plan-system__status-card--todo">
            <span>未完成</span>
            <strong>{statusCounts.todo}</strong>
          </div>
          <div className="study-plan-system__status-card study-plan-system__status-card--doing">
            <span>进行中</span>
            <strong>{statusCounts.doing}</strong>
          </div>
          <div className="study-plan-system__status-card study-plan-system__status-card--done">
            <span>已完成</span>
            <strong>{statusCounts.done}</strong>
          </div>
        </div>

        <div className="study-plan-system__toolbar">
          <div className="study-plan-system__filters">
            {filterOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  className={activeFilter === option.value ? "is-active" : ""}
                  key={option.value}
                  onClick={() => setActiveFilter(option.value)}
                  type="button"
                >
                  <Icon size={14} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          <button className="study-plan-system__create-button" onClick={handleStartCreate} type="button">
            <Plus size={16} />
            <span>{isFormOpen && !selectedTask ? "收起表单" : "添加任务"}</span>
          </button>
        </div>

        {isFormOpen ? (
          <div className="study-plan-system__editor study-plan-system__editor--reference">
            <label className="study-plan-system__field">
              <span>任务名称</span>
              <input
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="输入任务名称..."
                type="text"
                value={taskTitle}
              />
            </label>

            <label className="study-plan-system__field">
              <span>任务状态</span>
              <select
                className="study-plan-system__select"
                onChange={(event) => setTaskStatus(event.target.value as StudyTaskStatus)}
                value={taskStatus}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="study-plan-system__editor-actions">
              <button className="is-primary" onClick={handleCreateTask} type="button">
                <Plus size={16} />
                <span>新增任务</span>
              </button>
              <button disabled={!selectedTask} onClick={handleUpdateTask} type="button">
                <Save size={16} />
                <span>保存修改</span>
              </button>
              <button className="is-danger" disabled={!selectedTask} onClick={handleDeleteTask} type="button">
                <Trash2 size={16} />
                <span>删除任务</span>
              </button>
            </div>
          </div>
        ) : null}

        <div className="study-plan-system__task-list study-plan-system__task-list--cards">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <article className={`study-plan-system__task-card study-plan-system__task-card--${task.status}`} key={task.id}>
                <div className="study-plan-system__task-card-main">
                  <button className="study-plan-system__task-card-toggle" onClick={() => handleEditTask(task.id)} type="button">
                    <span className={`study-plan-system__status-dot study-plan-system__status-dot--${task.status}`} />
                  </button>
                  <div className="study-plan-system__task-card-copy">
                    <h3>{task.title}</h3>
                    <div className="study-plan-system__task-card-meta">
                      <span>{getStatusLabel(task.status)}</span>
                      <span>{new Date(task.updatedAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                  </div>
                </div>

                <div className="study-plan-system__task-card-actions">
                  <button onClick={() => handleEditTask(task.id)} type="button">
                    <Pencil size={14} />
                    <span>编辑</span>
                  </button>
                  <button
                    className="is-danger"
                    onClick={() => {
                      if (selectedTaskId === task.id) {
                        selectTask(task.id);
                      }
                      deleteTask(task.id);
                    }}
                    type="button"
                  >
                    <Trash2 size={14} />
                    <span>删除</span>
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="study-plan-system__empty">当前筛选条件下没有任务，先添加一条新的任务。</div>
          )}
        </div>
      </section>
    </section>
  );
}
