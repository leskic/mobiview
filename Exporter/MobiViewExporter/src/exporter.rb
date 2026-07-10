# encoding: UTF-8

require 'sketchup.rb'
require 'json'

require_relative 'utils'
require_relative 'dinabox_parser'
require_relative 'entity_filter'
require_relative 'entity_walker'
require_relative 'geometry_analyzer'
require_relative 'piece_reader'
require_relative 'json_writer'
require_relative 'manifest_writer'
require_relative 'project_writer'
require_relative 'pieces_writer'
require_relative 'modules_writer'
require_relative 'materials_writer'
require_relative 'mvproj_writer'
require_relative 'inspector'
require_relative 'dinabox_explorer'
require_relative 'knowledge_base'

module MobiViewExporter

  extend self

  PLUGIN_NAME = "MobiView Exporter"
  VERSION = "5.7.0"

  def collect_pieces

    model = Sketchup.active_model
    entities = EntityWalker.walk(model)
    pieces = []

    entities.each_with_index do |entry, index|

      begin

        entity = entry[:entity]
        world_transform = entry[:world_transform]

        piece = PieceReader.read(entity, index + 1, world_transform)

        mesh_positions = piece && piece.dig(:geometry, :mesh, :positions)
        pieces << piece if piece && mesh_positions && mesh_positions.length >= 9

      rescue => e

        entity_id = entry[:entity]&.persistent_id || "desconhecida"
        puts "ERRO AO LER PEÇA #{entity_id}"
        puts e.message
        puts e.backtrace

      end

    end

    pieces

  end

  def export_project

    model = Sketchup.active_model
    pieces = collect_pieces

    MvprojWriter.export(model, pieces)

    KnowledgeBase.learn(model, pieces)

  end

  def export_json

    model = Sketchup.active_model
    pieces = collect_pieces
    JsonWriter.save(model, pieces)

  end

  def inspector

    Inspector.run(Sketchup.active_model)

  end

  def explorer

    DinaboxExplorer.run(Sketchup.active_model)

  end

  def create_menu

    menu = UI.menu("Plugins").add_submenu(PLUGIN_NAME)

    menu.add_item("🖥️ Exportar JSON para o Viewer") {
      export_json
    }

    menu.add_separator

    menu.add_item("📦 Exportar Projeto MobiView") {
      export_project
    }

    menu.add_separator

    menu.add_item("🔍 Inspector") {
      inspector
    }

    menu.add_item("🧬 Dinabox Explorer") {
      explorer
    }

    menu.add_separator

    menu.add_item("Sobre") {
      UI.messagebox("#{PLUGIN_NAME}\nVersão #{VERSION}")
    }

  end

  def create_toolbar

    toolbar = UI::Toolbar.new(PLUGIN_NAME)

    cmd_export = UI::Command.new("Exportar MobiView") {
      export_json
    }

    icons_folder = File.expand_path("../icons", __dir__)
    cmd_export.small_icon = File.join(icons_folder, "mobiview_export_24.png")
    cmd_export.large_icon = File.join(icons_folder, "mobiview_export_32.png")
    cmd_export.tooltip = "Exportar Projeto MobiView"
    cmd_export.status_bar_text = "Exportar o projeto atual em JSON para o MobiView"
    cmd_export.menu_text = "Exportar JSON para o MobiView"
    toolbar.add_item(cmd_export)

    toolbar.restore

  end

  unless file_loaded?(__FILE__)

    create_menu
    create_toolbar
    file_loaded(__FILE__)

    puts "MobiView Exporter #{VERSION} carregado."

  end

end
