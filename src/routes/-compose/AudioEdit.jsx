import { Upload, Button, Slider } from "antd";
import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

// 正确解构 Dragger
const { Dragger } = Upload;

// 定义采样间隔（秒）为公共变量
const INTERVAL_SECONDS = 5;

const AudioPlayer = () => {
  const [waveformData, setWaveformData] = useState({
    labels: [],
    amplitudes: [],
    totalDuration: 0,
  });
  const [audioUrl, setAudioUrl] = useState(null);
  const [timeRange, setTimeRange] = useState([10, 20]); // Slider 默认值
  const [isPlaying, setIsPlaying] = useState(false); // 播放状态
  const [audioBuffer, setAudioBuffer] = useState(null); // 存储原始 audioBuffer 用于导出
  const [clippedAudioUrl, setClippedAudioUrl] = useState(null); // 存储裁剪后的音频 URL
  const svgRef = useRef();

  const audioRef = useRef();

  const processAudio = async (file) => {
    console.log("开始处理音频文件:", file.name);
    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    try {
      // 解码音频文件
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setAudioBuffer(audioBuffer); // 存储 audioBuffer
      const channelData = audioBuffer.getChannelData(0); // 获取第一个声道（单声道处理）
      const sampleRate = audioBuffer.sampleRate;
      const totalDuration = audioBuffer.duration; // 获取音频总时长（秒）
      console.log("音频解码成功，总时长:", totalDuration);

      // 计算每 INTERVAL_SECONDS 秒的样本数
      const samplesPerInterval = sampleRate * INTERVAL_SECONDS;
      const averages = [];

      // 每 INTERVAL_SECONDS 秒处理一次，计算 RMS 振幅
      for (let i = 0; i < channelData.length; i += samplesPerInterval) {
        const chunk = channelData.slice(i, i + samplesPerInterval);
        // 计算均方根（RMS）振幅
        const sum = chunk.reduce((acc, val) => acc + val * val, 0);
        const rms = Math.sqrt(sum / chunk.length) || 0; // 防止 NaN
        averages.push(rms);
      }

      // 生成时间标签（每 INTERVAL_SECONDS 秒）
      const labels = Array.from({ length: averages.length }, (_, i) =>
        (i * INTERVAL_SECONDS).toFixed(1),
      );
      console.log("生成波形数据:", {
        labels,
        amplitudes: averages,
        totalDuration,
      });

      // 更新波形数据状态，包括总时长
      setWaveformData({ labels, amplitudes: averages, totalDuration });

      // 创建音频 URL
      setAudioUrl(URL.createObjectURL(file));
    } catch (error) {
      console.error("处理音频出错:", error);
    }
  };

  // 播放指定时间段的函数
  const playAudioSegment = (startTime, endTime) => {
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = startTime;
      audioRef.current
        .play()
        .catch((error) => console.error("播放失败:", error));
      setIsPlaying(true);

      // 监听播放时间，停止播放到结束时间
      const checkTime = () => {
        if (audioRef.current && audioRef.current.currentTime >= endTime) {
          audioRef.current.pause();
          audioRef.current.currentTime = startTime; // 重置到开始时间
          setIsPlaying(false);
        }
      };
      audioRef.current.addEventListener("timeupdate", checkTime);
      // 清理事件监听
      audioRef.current.addEventListener(
        "pause",
        () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener("timeupdate", checkTime);
            audioRef.current.currentTime = startTime; // 确保暂停时重置
            setIsPlaying(false);
          }
        },
        { once: true },
      );
    }
  };

  // 暂停音频
  const pauseAudio = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = timeRange[0]; // 暂停时重置到开始时间
      setIsPlaying(false);
    }
  };

  // 导出音频片段（WAV 格式，存储不下载）
  const exportAudioSegment = async () => {
    if (!audioBuffer) {
      console.error("音频未加载");
      return;
    }

    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const startSample = Math.floor(timeRange[0] * audioBuffer.sampleRate);
      const endSample = Math.floor(timeRange[1] * audioBuffer.sampleRate);
      const durationSamples = endSample - startSample;

      // 创建新的 AudioBuffer
      const newBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        durationSamples,
        audioBuffer.sampleRate,
      );

      // 复制音频数据
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const newChannelData = newBuffer.getChannelData(channel);
        for (let i = 0; i < durationSamples; i++) {
          newChannelData[i] = channelData[startSample + i];
        }
      }

      // 转换为 WAV
      const wav = audioBufferToWav(newBuffer);
      const wavBlob = new Blob([wav], { type: "audio/wav" });

      // 创建 URL 并存储
      if (clippedAudioUrl) {
        URL.revokeObjectURL(clippedAudioUrl); // 清理旧 URL
      }
      const url = URL.createObjectURL(wavBlob);
      setClippedAudioUrl(url);
      console.log("WAV 音频导出成功，可预览");
    } catch (error) {
      console.error("导出音频出错:", error);
    }
  };

  // 将 AudioBuffer 转换为 WAV（辅助函数）
  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numChannels * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);

    // 写入 WAV 头
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    let offset = 0;
    writeString(view, offset, "RIFF");
    offset += 4;
    view.setUint32(offset, length - 8, true);
    offset += 4;
    writeString(view, offset, "WAVE");
    offset += 4;
    writeString(view, offset, "fmt ");
    offset += 4;
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2; // PCM format
    view.setUint16(offset, numChannels, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, sampleRate * numChannels * 2, true);
    offset += 4;
    view.setUint16(offset, numChannels * 2, true);
    offset += 2;
    view.setUint16(offset, 16, true);
    offset += 2;
    writeString(view, offset, "data");
    offset += 4;
    view.setUint32(offset, buffer.length * numChannels * 2, true);
    offset += 4;

    // 写入音频数据
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i] * 32767; // 转换为 16-bit PCM
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return bufferArray;
  };

  // 处理 Slider 值变化
  const handleSliderChange = (value) => {
    setTimeRange(value);
  };

  // 更新播放状态
  useEffect(() => {
    if (audioRef.current) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.currentTime = timeRange[0]; // 确保暂停时重置
        }
      };
      const handleEnded = () => {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.currentTime = timeRange[0]; // 播放结束重置
        }
      };

      audioRef.current.addEventListener("play", handlePlay);
      audioRef.current.addEventListener("pause", handlePause);
      audioRef.current.addEventListener("ended", handleEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("play", handlePlay);
          audioRef.current.removeEventListener("pause", handlePause);
          audioRef.current.removeEventListener("ended", handleEnded);
        }
      };
    }
  }, [audioUrl, timeRange]);

  useEffect(() => {
    if (waveformData.amplitudes && waveformData.amplitudes.length > 0) {
      console.log("开始渲染 SVG，波形数据:", waveformData);
      // SVG 尺寸
      const width = 800;
      const height = 300;
      const margin = { top: 40, right: 30, bottom: 50, left: 50 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // 清空之前的 SVG
      d3.select(svgRef.current).selectAll("*").remove();

      // 创建 SVG
      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .style("border", "1px solid #ccc") // 添加边框以调试 SVG 可见性
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // X 轴比例尺（时间）
      const xScale = d3
        .scaleBand()
        .domain(waveformData.labels)
        .range([0, innerWidth])
        .padding(0.2);

      // Y 轴比例尺（振幅），上下对称
      const maxAmplitude = d3.max(waveformData.amplitudes);
      const yScale = d3
        .scaleLinear()
        .domain([-maxAmplitude, maxAmplitude])
        .range([innerHeight, 0])
        .nice();

      // 绘制水平中心线
      svg
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", innerHeight / 2)
        .attr("y2", innerHeight / 2)
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

      // 绘制柱子，居中对齐，带圆角，Y 方向上下居中
      svg
        .selectAll("rect")
        .data(waveformData.amplitudes)
        .enter()
        .append("rect")
        .attr(
          "x",
          (_, i) => xScale(waveformData.labels[i]) + xScale.bandwidth() * 0.1,
        )
        .attr("y", (d) =>
          yScale(d) < innerHeight / 2 ? yScale(d) : yScale(-d),
        )
        .attr("width", xScale.bandwidth() * 0.8)
        .attr("height", (d) => Math.abs(yScale(d) - yScale(-d)))
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", "#d3d3d3"); // 默认灰色

      // 添加标题，显示总时长（整数）
      svg
        .append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(
          `音频波形（总时长：${Math.floor(waveformData.totalDuration)}秒）`,
        );
    } else {
      console.log("未渲染 SVG，波形数据为空:", waveformData);
      // 清空 SVG 并显示提示
      d3.select(svgRef.current).selectAll("*").remove();
      d3.select(svgRef.current)
        .attr("width", 800)
        .attr("height", 300)
        .style("border", "1px solid #ccc") // 添加边框以调试
        .append("text")
        .attr("x", 400)
        .attr("y", 150)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("请上传 MP3 文件以显示波形");
    }
  }, [waveformData]);

  // 更新柱子颜色
  useEffect(() => {
    if (
      audioRef.current &&
      waveformData.labels &&
      waveformData.labels.length > 0
    ) {
      const innerWidth = 800 - 50 - 30; // width - margin.left - margin.right
      const duration = waveformData.totalDuration;

      const updateBarColors = () => {
        if (audioRef.current) {
          const currentTime = audioRef.current.currentTime;
          d3.select(svgRef.current)
            .selectAll("rect")
            .transition()
            .duration(500) // 0.5 秒过渡动画
            .attr("fill", (_, i) => {
              const barTime = i * INTERVAL_SECONDS;
              return barTime <= currentTime ? "#1890ff" : "#d3d3d3";
            });
        }
      };

      audioRef.current.addEventListener("timeupdate", updateBarColors);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("timeupdate", updateBarColors);
        }
      };
    }
  }, [waveformData, audioUrl]);

  // 清理 clippedAudioUrl
  useEffect(() => {
    return () => {
      if (clippedAudioUrl) {
        URL.revokeObjectURL(clippedAudioUrl);
      }
    };
  }, [clippedAudioUrl]);

  const props = {
    name: "file",
    multiple: true,
    accept: "audio/mp3",
    beforeUpload(file) {
      console.log("上传文件:", file);
      processAudio(file);
      return false; // 阻止默认上传行为
    },
  };

  return (
    <div className="audio-player">
      <Dragger {...props}>
        <Button type="primary">上传 MP3</Button>
      </Dragger>
      <audio ref={audioRef} src={audioUrl} />
      <div style={{ margin: "20px 0", width: "800px" }}>
        <Slider
          range={{ draggableTrack: true }}
          defaultValue={[10, 20]}
          min={0}
          max={
            waveformData.totalDuration > 0 ? waveformData.totalDuration : 100
          }
          onChange={handleSliderChange}
          value={timeRange}
          disabled={waveformData.totalDuration === 0}
        />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <Button
          onClick={() =>
            isPlaying
              ? pauseAudio()
              : playAudioSegment(timeRange[0], timeRange[1])
          }
          disabled={waveformData.totalDuration === 0}
          style={{ marginRight: "10px" }}
        >
          {isPlaying ? "暂停" : "播放"} {timeRange[0]}-{timeRange[1]} 秒
        </Button>
        <Button
          onClick={exportAudioSegment}
          disabled={waveformData.totalDuration === 0 || !audioBuffer}
        >
          导出 WAV
        </Button>
      </div>
      {clippedAudioUrl && (
        <div style={{ marginBottom: "20px" }}>
          <p>裁剪后的音频（WAV 格式）：</p>
          <audio controls src={clippedAudioUrl} />
        </div>
      )}
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default AudioPlayer;
